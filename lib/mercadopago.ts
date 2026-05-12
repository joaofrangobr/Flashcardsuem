export const studentPlan = {
  id: "aluno-mensal",
  title: "Plano Aluno",
  planName: "Aluno mensal",
  amount: 19.9,
  amountCents: 1990,
  durationDays: 30,
  description: "Acesso individual aos simulados, área do aluno e desempenho.",
};

const mercadoPagoAccessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

export const isMercadoPagoConfigured = Boolean(mercadoPagoAccessToken);

export function getBaseUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://127.0.0.1:3000";
}

type MercadoPagoPreferenceResponse = {
  id: string;
  init_point?: string;
  sandbox_init_point?: string;
};

export async function createMercadoPagoPreference(params: {
  userId: string;
  email?: string | null;
  externalReference: string;
}) {
  if (!mercadoPagoAccessToken) {
    throw new Error("Mercado Pago não configurado.");
  }

  const baseUrl = getBaseUrl();
  const payload = {
    items: [
      {
        id: studentPlan.id,
        title: studentPlan.title,
        description: studentPlan.description,
        quantity: 1,
        currency_id: "BRL",
        unit_price: studentPlan.amount,
      },
    ],
    payer: params.email ? { email: params.email } : undefined,
    external_reference: params.externalReference,
    notification_url: `${baseUrl}/api/mercadopago/webhook`,
    back_urls: {
      success: `${baseUrl}/pricing?status=success`,
      pending: `${baseUrl}/pricing?status=pending`,
      failure: `${baseUrl}/pricing?status=failure`,
    },
    auto_return: "approved",
    statement_descriptor: "UEM ESTUDOS",
    metadata: {
      user_id: params.userId,
      plan_name: studentPlan.planName,
      duration_days: studentPlan.durationDays,
    },
  };

  const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${mercadoPagoAccessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Falha ao criar checkout no Mercado Pago: ${details}`);
  }

  const data = (await response.json()) as MercadoPagoPreferenceResponse;
  return {
    preferenceId: data.id,
    initPoint: data.init_point || data.sandbox_init_point || "",
  };
}

type MercadoPagoPayment = {
  id: number;
  status: string;
  status_detail?: string;
  transaction_amount?: number;
  date_approved?: string | null;
  payer?: {
    email?: string | null;
  };
  external_reference?: string | null;
};

export async function getMercadoPagoPayment(paymentId: string) {
  if (!mercadoPagoAccessToken) {
    throw new Error("Mercado Pago não configurado.");
  }

  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: {
      Authorization: `Bearer ${mercadoPagoAccessToken}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Falha ao consultar pagamento no Mercado Pago: ${details}`);
  }

  return (await response.json()) as MercadoPagoPayment;
}
