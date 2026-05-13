-- Supabase schema inicial para cards-app
-- Rode este arquivo no SQL editor do Supabase.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text,
  role text not null default 'student' check (role in ('student', 'moderator', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles
add column if not exists role text not null default 'student';

alter table public.profiles
add column if not exists avatar_url text;

alter table public.profiles
add column if not exists last_study_at timestamptz;

alter table public.profiles
add column if not exists total_correct_count integer not null default 0;

alter table public.profiles
add column if not exists total_partial_count integer not null default 0;

alter table public.profiles
add column if not exists total_wrong_count integer not null default 0;

alter table public.profiles
drop constraint if exists profiles_role_check;

alter table public.profiles
add constraint profiles_role_check check (role in ('student', 'moderator', 'admin'));

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_name text not null,
  status text not null check (status in ('active', 'trialing', 'past_due', 'canceled', 'expired')),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  payment_provider text,
  payment_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.checkout_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_name text not null,
  amount_cents integer not null,
  status text not null check (status in ('created', 'pending', 'approved', 'rejected', 'cancelled', 'refunded', 'charged_back')),
  payment_provider text not null default 'mercadopago',
  external_reference text not null unique,
  mercado_pago_preference_id text,
  mercado_pago_payment_id text,
  checkout_url text,
  payer_email text,
  raw_payload jsonb,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.study_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exam text not null,
  discipline text,
  correct_count integer not null default 0,
  partial_count integer not null default 0,
  wrong_count integer not null default 0,
  total_count integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.study_results
add column if not exists partial_count integer not null default 0;

create table if not exists public.study_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exam text not null,
  study_mode text not null check (study_mode in ('pas', 'vestibular')),
  total_questions integer not null default 0,
  answered_questions integer not null default 0,
  correct_count integer not null default 0,
  partial_count integer not null default 0,
  wrong_count integer not null default 0,
  finished_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.study_attempts
add column if not exists partial_count integer not null default 0;

create table if not exists public.study_attempt_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.study_attempts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  exam text not null,
  question_id text not null,
  question_number integer not null,
  discipline text,
  selected_codes text[] not null default '{}',
  selected_sum integer not null default 0,
  official_answer integer,
  is_correct boolean,
  result_status text not null default 'pending' check (result_status in ('correct', 'partial', 'wrong', 'pending', 'no_official')),
  created_at timestamptz not null default now()
);

alter table public.study_attempt_answers
add column if not exists result_status text not null default 'pending';

alter table public.study_attempt_answers
drop constraint if exists study_attempt_answers_result_status_check;

alter table public.study_attempt_answers
add constraint study_attempt_answers_result_status_check
check (result_status in ('correct', 'partial', 'wrong', 'pending', 'no_official'));

create table if not exists public.study_attempt_disciplines (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.study_attempts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  exam text not null,
  discipline text not null,
  total_questions integer not null default 0,
  answered_questions integer not null default 0,
  correct_count integer not null default 0,
  partial_count integer not null default 0,
  wrong_count integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.study_attempt_disciplines
add column if not exists partial_count integer not null default 0;

create table if not exists public.study_question_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exam text not null,
  study_mode text not null check (study_mode in ('pas', 'vestibular')),
  question_id text not null,
  question_number integer not null,
  discipline text,
  selected_codes text[] not null default '{}',
  selected_sum integer not null default 0,
  official_answer integer,
  result_status text not null check (result_status in ('correct', 'partial', 'wrong', 'no_official')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, question_id)
);

alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.checkout_payments enable row level security;
alter table public.study_results enable row level security;
alter table public.study_attempts enable row level security;
alter table public.study_attempt_answers enable row level security;
alter table public.study_attempt_disciplines enable row level security;
alter table public.study_question_progress enable row level security;

create or replace function public.current_user_is_admin()
returns boolean as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$ language sql stable security definer set search_path = public;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_select_admin" on public.profiles;
drop policy if exists "profiles_update_admin" on public.profiles;
drop policy if exists "subscriptions_select_own" on public.subscriptions;
drop policy if exists "subscriptions_select_admin" on public.subscriptions;
drop policy if exists "subscriptions_insert_admin" on public.subscriptions;
drop policy if exists "subscriptions_update_admin" on public.subscriptions;
drop policy if exists "checkout_payments_select_own" on public.checkout_payments;
drop policy if exists "checkout_payments_select_admin" on public.checkout_payments;
drop policy if exists "study_results_select_own" on public.study_results;
drop policy if exists "study_results_select_admin" on public.study_results;
drop policy if exists "study_results_insert_own" on public.study_results;
drop policy if exists "study_attempts_select_own" on public.study_attempts;
drop policy if exists "study_attempts_select_admin" on public.study_attempts;
drop policy if exists "study_attempts_insert_own" on public.study_attempts;
drop policy if exists "study_attempt_answers_select_own" on public.study_attempt_answers;
drop policy if exists "study_attempt_answers_select_admin" on public.study_attempt_answers;
drop policy if exists "study_attempt_answers_insert_own" on public.study_attempt_answers;
drop policy if exists "study_attempt_disciplines_select_own" on public.study_attempt_disciplines;
drop policy if exists "study_attempt_disciplines_select_admin" on public.study_attempt_disciplines;
drop policy if exists "study_attempt_disciplines_insert_own" on public.study_attempt_disciplines;
drop policy if exists "study_question_progress_select_own" on public.study_question_progress;
drop policy if exists "study_question_progress_select_admin" on public.study_question_progress;
drop policy if exists "study_question_progress_insert_own" on public.study_question_progress;
drop policy if exists "study_question_progress_update_own" on public.study_question_progress;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_select_admin" on public.profiles for select using (public.current_user_is_admin());
create policy "profiles_update_admin" on public.profiles for update using (public.current_user_is_admin());

create policy "subscriptions_select_own" on public.subscriptions for select using (auth.uid() = user_id);
create policy "subscriptions_select_admin" on public.subscriptions for select using (public.current_user_is_admin());
create policy "subscriptions_insert_admin" on public.subscriptions for insert with check (public.current_user_is_admin());
create policy "subscriptions_update_admin" on public.subscriptions for update using (public.current_user_is_admin());
create policy "checkout_payments_select_own" on public.checkout_payments for select using (auth.uid() = user_id);
create policy "checkout_payments_select_admin" on public.checkout_payments for select using (public.current_user_is_admin());
create policy "study_results_select_own" on public.study_results for select using (auth.uid() = user_id);
create policy "study_results_select_admin" on public.study_results for select using (public.current_user_is_admin());
create policy "study_results_insert_own" on public.study_results for insert with check (auth.uid() = user_id);
create policy "study_attempts_select_own" on public.study_attempts for select using (auth.uid() = user_id);
create policy "study_attempts_select_admin" on public.study_attempts for select using (public.current_user_is_admin());
create policy "study_attempts_insert_own" on public.study_attempts for insert with check (auth.uid() = user_id);
create policy "study_attempt_answers_select_own" on public.study_attempt_answers for select using (auth.uid() = user_id);
create policy "study_attempt_answers_select_admin" on public.study_attempt_answers for select using (public.current_user_is_admin());
create policy "study_attempt_answers_insert_own" on public.study_attempt_answers for insert with check (auth.uid() = user_id);
create policy "study_attempt_disciplines_select_own" on public.study_attempt_disciplines for select using (auth.uid() = user_id);
create policy "study_attempt_disciplines_select_admin" on public.study_attempt_disciplines for select using (public.current_user_is_admin());
create policy "study_attempt_disciplines_insert_own" on public.study_attempt_disciplines for insert with check (auth.uid() = user_id);
create policy "study_question_progress_select_own" on public.study_question_progress for select using (auth.uid() = user_id);
create policy "study_question_progress_select_admin" on public.study_question_progress for select using (public.current_user_is_admin());
create policy "study_question_progress_insert_own" on public.study_question_progress for insert with check (auth.uid() = user_id);
create policy "study_question_progress_update_own" on public.study_question_progress for update using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', ''));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

update public.profiles
set role = 'admin', name = coalesce(nullif(name, ''), 'Administrador')
where lower(email) = 'moderadorsite@gmail.com';
