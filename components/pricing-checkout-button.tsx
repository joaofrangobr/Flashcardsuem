"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type CheckoutState = "idle" | "loading" | "error";

function getStatusCopy(status: string | null) {
  if (status === "success") {
    return {
      className: "notice success-notice",
      message:
        "Pagamento recebido pelo Mercado Pago. Assim que a confirmação chegar no sistema, o acesso será liberado automaticamente.",
    };
  }

  if (status === "pending") {
    return {
      className: "notice",
      message:
        "O pagamento ainda está pendente de confirmação. Quando o Mercado Pago aprovar, o acesso será liberado automaticamente.",
    };
  }

  if (status === "failure") {
    return {
      className: "notice error-notice",
      message:
        "O pagamento não foi concluído. Você pode tentar novamente ou falar conosco se precisar de ajuda.",
    };
  }

  return null;
}

export function PricingCheckoutButton() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<CheckoutState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const statusNotice = useMemo(
    () => getStatusCopy(searchParams.get("status")),
    [searchParams],
  );

  async function handleCheckout() {
    setState("loading");
    setErrorMessage("");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Entre na sua conta antes de seguir para o pagamento.");
      }

      const response = await fetch("/api/mercadopago/create-preference", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken: session.access_token,
        }),
      });

      const payload = (await response.json()) as { initPoint?: string; error?: string };

      if (!response.ok || !payload.initPoint) {
        throw new Error(payload.error || "Não foi possível iniciar o checkout.");
      }

      window.location.href = payload.initPoint;
    } catch (error) {
      setState("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Não foi possível iniciar o pagamento.",
      );
      return;
    }

    setState("idle");
  }

  return (
    <>
      {statusNotice ? <div className={statusNotice.className}>{statusNotice.message}</div> : null}
      {errorMessage ? <div className="notice error-notice">{errorMessage}</div> : null}
      <button className="button" onClick={handleCheckout} disabled={state === "loading"}>
        {state === "loading" ? "Abrindo checkout..." : "Pagar com Mercado Pago"}
      </button>
    </>
  );
}
