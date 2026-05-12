import { NextResponse } from "next/server";
import { getMercadoPagoPayment, isMercadoPagoConfigured, studentPlan } from "@/lib/mercadopago";
import { isSupabaseAdminConfigured, supabaseAdmin } from "@/lib/supabase-admin";

function mapMercadoPagoStatus(status: string) {
  switch (status) {
    case "approved":
      return "approved";
    case "pending":
    case "in_process":
      return "pending";
    case "cancelled":
      return "cancelled";
    case "rejected":
      return "rejected";
    case "refunded":
      return "refunded";
    case "charged_back":
      return "charged_back";
    default:
      return "pending";
  }
}

export async function POST(request: Request) {
  try {
    if (!isMercadoPagoConfigured || !isSupabaseAdminConfigured || !supabaseAdmin) {
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    const payload = await request.json().catch(() => null);
    const topic = payload?.type || payload?.topic;
    const resourceId =
      payload?.data?.id || payload?.resource?.split("/").pop() || payload?.id || null;

    if (topic !== "payment" || !resourceId) {
      return NextResponse.json({ received: true });
    }

    const payment = await getMercadoPagoPayment(String(resourceId));
    const externalReference = payment.external_reference || "";
    const userId = externalReference.split(":")[0];

    if (!userId) {
      return NextResponse.json({ received: true });
    }

    const checkoutStatus = mapMercadoPagoStatus(payment.status);

    await supabaseAdmin
      .from("checkout_payments")
      .update({
        status: checkoutStatus,
        mercado_pago_payment_id: String(payment.id),
        payer_email: payment.payer?.email ?? null,
        raw_payload: payment,
        approved_at: payment.date_approved ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("external_reference", externalReference);

    if (payment.status === "approved") {
      const { data: existingSubscription } = await supabaseAdmin
        .from("subscriptions")
        .select("id")
        .eq("payment_id", String(payment.id))
        .maybeSingle();

      if (!existingSubscription) {
        await supabaseAdmin
          .from("subscriptions")
          .update({
            status: "expired",
            ends_at: new Date().toISOString(),
          })
          .eq("user_id", userId)
          .in("status", ["active", "trialing"]);

        const { error: subscriptionError } = await supabaseAdmin.from("subscriptions").insert({
          user_id: userId,
          plan_name: studentPlan.planName,
          status: "active",
          starts_at: payment.date_approved ?? new Date().toISOString(),
          ends_at: new Date(
            Date.now() + studentPlan.durationDays * 24 * 60 * 60 * 1000,
          ).toISOString(),
          payment_provider: "mercadopago",
          payment_id: String(payment.id),
        });

        if (subscriptionError) {
          return NextResponse.json(
            { received: false, error: subscriptionError.message },
            { status: 500 },
          );
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json(
      {
        received: false,
        error: error instanceof Error ? error.message : "Falha ao processar webhook.",
      },
      { status: 500 },
    );
  }
}
