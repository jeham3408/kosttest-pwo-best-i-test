-- Fjern butikk/merke som egen tilbakemeldingstype (vi rangerer kun kosttilskudd).
alter table public.feedback_submissions
  drop constraint if exists feedback_submissions_type_check;

alter table public.feedback_submissions
  add constraint feedback_submissions_type_check
  check (type in ('missing_product', 'other'));
