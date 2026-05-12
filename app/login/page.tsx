"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [message, setMessage] = useState(
    isSupabaseConfigured
      ? "Entre ou crie uma conta para acessar seu plano."
      : "O login ainda precisa das chaves reais do Supabase para funcionar.",
  );

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) {
        setIsLoggedIn(true);
        setMessage(`Você já está conectado como ${data.user.email}.`);
      }
    });
  }, []);

  async function signUp() {
    if (!isSupabaseConfigured) {
      setMessage("Configure o arquivo .env.local com as chaves do Supabase antes de criar contas.");
      return;
    }

    const { error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Conta criada. Confira seu e-mail para confirmar o acesso.");
  }

  async function signIn() {
    if (!isSupabaseConfigured) {
      setMessage("Configure o Supabase para liberar o login real dos alunos.");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setIsLoggedIn(false);
      setMessage(error.message);
      return;
    }

    setIsLoggedIn(true);
    setMessage("Login realizado. Agora você pode acessar a área do aluno.");
  }

  async function signOut() {
    if (!isSupabaseConfigured) {
      setMessage("Nenhuma conta ativa. O Supabase ainda não foi configurado.");
      return;
    }

    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setMessage("Você saiu da conta.");
  }

  return (
    <section className="panel auth-panel">
      <p className="eyebrow">Conta segura</p>
      <h1>Entrar ou criar cadastro</h1>
      {!isSupabaseConfigured && (
        <p className="notice">
          Para ativar o login, preencha o arquivo `.env.local` com `NEXT_PUBLIC_SUPABASE_URL` e
          `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
        </p>
      )}
      <label>
        Nome
        <input
          disabled={!isSupabaseConfigured}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Seu nome"
        />
      </label>
      <label>
        E-mail
        <input
          disabled={!isSupabaseConfigured}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="voce@email.com"
        />
      </label>
      <label>
        Senha
        <input
          disabled={!isSupabaseConfigured}
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Mínimo de 6 caracteres"
        />
      </label>
      <div className="actions">
        <button disabled={!isSupabaseConfigured} onClick={signIn}>
          Fazer login
        </button>
        <button disabled={!isSupabaseConfigured} className="secondary" onClick={signUp}>
          Criar conta
        </button>
        <button disabled={!isSupabaseConfigured} className="secondary" onClick={signOut}>
          Sair
        </button>
        {isLoggedIn && (
          <Link className="button" href="/dashboard">
            Ir para área do aluno
          </Link>
        )}
      </div>
      <p className="section-copy">{message}</p>
    </section>
  );
}
