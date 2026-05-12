import { NextResponse } from "next/server";
import {
  createMercadoPagoPreference,
  isMercadoPagoConfigured,
  studentPlan,
} from "@/lib/mercadopago";
import {
  getUserFromAccessToken,
  isSupabaseAdminConfigured,
  supabaseAdmin,
} from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    if (!isMercadoPagoConfigured || !isSupabaseAdminConfigured || !supabaseAdmin) {
      return NextResponse.json(
        { error: "Pagamento automático ainda não está configurado no servidor." },
        { status: 500 },
      );
    }

    const body = (await request.json()) as { accessToken?: string };

    if (!body.accessToken) {
      return NextResponse.json({ error: "Sessão não informada." }, { status: 400 });
    }

    const user = await getUserFromAccessToken(body.accessToken);
    const externalReference = `${user.id}:${Date.now()}`;

    const preference = await createMercadoPagoPreference({
      userId: user.id,
      email: user.email,
      externalReference,
    });

    const { error } = await supabaseAdmin.from("checkout_payments").insert({
      user_id: user.id,
      plan_name: studentPlan.planName,
      amount_cents: studentPlan.amountCents,
      status: "created",
      payment_provider: "mercadopago",
      external_reference: externalReference,
      mercado_pago_preference_id: preference.preferenceId,
      checkout_url: preference.initPoint,
      payer_email: user.email ?? null,
    });

    if (error) {
      return NextResponse.json(
        { error: `Não foi possível registrar o checkout: ${error.message}` },
        { status: 500 },
      );
    }

    return NextResponse.json({
      initPoint: preference.initPoint,
      preferenceId: preference.preferenceId,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível iniciar o checkout do Mercado Pago.",
      },
      { status: 500 },
    );
  }
}
