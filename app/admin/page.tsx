"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getAccessRole } from "@/lib/access";
import { supabase } from "@/lib/supabase";

type Profile = {
  id: string;
  email: string | null;
  name: string | null;
  role: string | null;
  created_at: string | null;
};

type Subscription = {
  id: string;
  user_id: string;
  plan_name: string | null;
  status: string | null;
  ends_at: string | null;
  payment_provider: string | null;
  payment_id: string | null;
  created_at: string | null;
};

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState("");
  const [planName, setPlanName] = useState("Aluno mensal");
  const [days, setDays] = useState(30);

  async function loadAdminData() {
    setMessage("");
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    setAdminEmail(user?.email || "");

    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    const { data: ownProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const role = getAccessRole(user.email, ownProfile?.role);
    setIsAdmin(role === "admin");

    if (role !== "admin") {
      setLoading(false);
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id,email,name,role,created_at")
      .order("created_at", { ascending: false });

    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from("subscriptions")
      .select("id,user_id,plan_name,status,ends_at,payment_provider,payment_id,created_at")
      .order("created_at", { ascending: false });

    if (profileError || subscriptionError) {
      setMessage(
        "Não foi possível ler usuários e assinaturas. Rode o schema.sql atualizado no Supabase para liberar as policies de admin.",
      );
    }

    setProfiles(profileData || []);
    setSubscriptions(subscriptionData || []);
    setLoading(false);
  }

  useEffect(() => {
    loadAdminData();
  }, []);

  const manualSql = useMemo(() => {
    const cleanUserId = userId.trim() || "ID_DO_USUARIO";
    const cleanPlan = planName.trim() || "Aluno mensal";
    const cleanDays = Number.isFinite(days) && days > 0 ? days : 30;
    return `insert into public.subscriptions (user_id, plan_name, status, ends_at, payment_provider, payment_id)
values ('${cleanUserId}', '${cleanPlan.replaceAll("'", "''")}', 'active', now() + interval '${cleanDays} days', 'manual', 'liberado-admin');`;
  }, [days, planName, userId]);

  async function activateSubscription() {
    if (!userId.trim()) {
      setMessage("Informe o ID do usuário para liberar acesso.");
      return;
    }

    const expiresAt = new Date(Date.now() + Math.max(days, 1) * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase.from("subscriptions").insert({
      user_id: userId.trim(),
      plan_name: planName.trim() || "Aluno mensal",
      status: "active",
      ends_at: expiresAt,
      payment_provider: "manual",
      payment_id: "liberado-admin",
    });

    if (error) {
      setMessage(`Erro ao liberar assinatura: ${error.message}`);
      return;
    }

    setMessage("Assinatura liberada com sucesso.");
    setUserId("");
    await loadAdminData();
  }

  if (loading) {
    return (
      <section className="panel">
        <p>Carregando painel admin...</p>
      </section>
    );
  }

  if (!isAdmin) {
    return (
      <section className="panel">
        <p className="eyebrow">Admin</p>
        <h1>Acesso restrito.</h1>
        <p className="section-copy">Entre com a conta administradora para acessar este painel.</p>
        <p className="section-copy">Conta atual: {adminEmail || "nenhuma"}</p>
        <Link className="button" href="/login">
          Entrar
        </Link>
      </section>
    );
  }

  return (
    <section className="screen-stack">
      <section className="panel">
        <p className="eyebrow">Admin</p>
        <h1>Painel administrativo</h1>
        <p className="section-copy">Conta administradora: {adminEmail}</p>
        {message && <p className="notice">{message}</p>}
      </section>

      <section className="panel admin-form">
        <h2>Liberar plano Aluno</h2>
        <p className="section-copy">
          Cole o ID do usuário e libere acesso manual por pagamento confirmado.
        </p>
        <label>
          ID do usuário
          <input
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            placeholder="uuid do usuário"
          />
        </label>
        <label>
          Plano
          <input value={planName} onChange={(event) => setPlanName(event.target.value)} />
        </label>
        <label>
          Dias
          <input
            type="number"
            min={1}
            value={days}
            onChange={(event) => setDays(Number(event.target.value))}
          />
        </label>
        <div className="actions">
          <button onClick={activateSubscription}>Liberar acesso</button>
          <button className="secondary" onClick={loadAdminData}>
            Atualizar lista
          </button>
        </div>
        <pre className="sql-box">{manualSql}</pre>
      </section>

      <section className="panel">
        <h2>Usuários</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Role</th>
                <th>ID</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((profile) => (
                <tr key={profile.id}>
                  <td>{profile.name || "-"}</td>
                  <td>{profile.email || "-"}</td>
                  <td>{profile.role || "student"}</td>
                  <td>
                    <button className="link-button" onClick={() => setUserId(profile.id)}>
                      usar ID
                    </button>
                  </td>
                </tr>
              ))}
              {!profiles.length && (
                <tr>
                  <td colSpan={4}>Nenhum usuário carregado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <h2>Assinaturas</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Plano</th>
                <th>Status</th>
                <th>Validade</th>
                <th>Usuário</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((subscription) => (
                <tr key={subscription.id}>
                  <td>{subscription.plan_name || "-"}</td>
                  <td>{subscription.status || "-"}</td>
                  <td>
                    {subscription.ends_at
                      ? new Date(subscription.ends_at).toLocaleDateString("pt-BR")
                      : "-"}
                  </td>
                  <td>{subscription.user_id}</td>
                </tr>
              ))}
              {!subscriptions.length && (
                <tr>
                  <td colSpan={4}>Nenhuma assinatura carregada.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
