# Cards App

Nova versão do app preparada para sair do site estático.

## O que já existe

- Next.js App Router
- Login/cadastro com Supabase Auth
- Dashboard com status da assinatura
- Página de planos
- Página de política de uso
- Página de estudo protegida por assinatura ativa
- Schema SQL inicial do Supabase

## Como rodar localmente

1. Instale Node.js LTS.
2. Abra esta pasta no terminal.
3. Instale dependências:

```bash
npm install
```

4. Copie `.env.example` para `.env.local` e preencha:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

5. Rode:

```bash
npm run dev
```

## Como configurar Supabase

1. Crie um projeto em https://supabase.com.
2. Copie URL e anon key para `.env.local`.
3. Abra o SQL editor do Supabase.
4. Rode `supabase/schema.sql`.
5. Ative confirmação por e-mail se quiser mais segurança.

## Como liberar um aluno manualmente

No Supabase, insira uma linha em `subscriptions`:

```sql
insert into public.subscriptions (user_id, plan_name, status, ends_at)
values ('ID_DO_USUARIO', 'Aluno mensal', 'active', now() + interval '30 days');
```

## Próximas etapas

- Conectar Mercado Pago.
- Criar webhook para ativar assinatura automaticamente.
- Migrar `question-bank.js` para tabelas protegidas.
- Salvar resultados de simulados em `study_results`.
