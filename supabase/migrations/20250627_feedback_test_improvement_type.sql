-- Legg til test_improvement som tilbakemeldingstype
alter table public.feedback_submissions
  drop constraint if exists feedback_submissions_type_check;

alter table public.feedback_submissions
  add constraint feedback_submissions_type_check
  check (type in ('missing_product', 'product_error', 'test_improvement', 'other'));
