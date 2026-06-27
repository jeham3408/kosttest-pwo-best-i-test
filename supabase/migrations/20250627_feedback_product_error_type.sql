-- Legg til product_error som tilbakemeldingstype
alter table public.feedback_submissions
  drop constraint if exists feedback_submissions_type_check;

alter table public.feedback_submissions
  add constraint feedback_submissions_type_check
  check (type in ('missing_product', 'product_error', 'other'));

-- Tillat anonyme innsendinger via anon key (kun INSERT)
drop policy if exists "Public can submit feedback" on public.feedback_submissions;

create policy "Public can submit feedback"
  on public.feedback_submissions
  for insert
  to anon
  with check (true);
