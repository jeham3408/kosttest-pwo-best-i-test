-- Tilbakemeldinger fra footer-skjema på kosttest.no
-- Kjør i Supabase SQL Editor eller via CLI.

create table if not exists public.feedback_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  type text not null check (type in ('missing_product', 'other')),
  name text,
  category text check (category is null or category in ('pwo', 'protein', 'kreatin', 'annet')),
  message text not null,
  email text,
  source_page text not null default '/',
  status text not null default 'pending' check (status in ('pending', 'processing', 'triaged', 'duplicate', 'accepted', 'rejected')),
  triage_notes text,
  triage_result jsonb
);

create index if not exists feedback_submissions_status_created_idx
  on public.feedback_submissions (status, created_at desc);

alter table public.feedback_submissions enable row level security;

-- Kun service role (API) skriver; ingen offentlig lesing.
create policy "Service role full access"
  on public.feedback_submissions
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
