"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getAccessRole } from "@/lib/access";
import { supabase } from "@/lib/supabase";

const links = [
  ["Início", "/"],
  ["Planos", "/pricing"],
  ["Entrar", "/login"],
  ["Área do aluno", "/dashboard"],
  ["Termos", "/terms"],
] as const;

export function Header() {
  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!mounted || !user) {
        if (mounted) setShowAdmin(false);
        return;
      }

      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      if (!mounted) return;

      setShowAdmin(getAccessRole(user.email, profile?.role) === "admin");
    }

    loadUser();
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user;
      if (!user) {
        setShowAdmin(false);
        return;
      }

      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      setShowAdmin(getAccessRole(user.email, profile?.role) === "admin");
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link className="brand" href="/">
          UEM Estudos
        </Link>
        <nav>
          {links.map(([label, href]) => (
            <Link key={href} href={href}>
              {label}
            </Link>
          ))}
          {showAdmin && <Link href="/admin">Admin</Link>}
        </nav>
      </div>
    </header>
  );
}
