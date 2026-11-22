-- Proposta para revisão futura. Fora do diretório de migrações.
begin;
create table public.inspection_reviews (
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  model_version text not null check (model_version = 'aurea-v03'),
  case_code text not null check (case_code in ('R01','R02','R03','R04','R05')),
  status text not null check (status in ('Não avaliado','Em análise','Avaliado','Requer revisão')),
  notes text not null default '' check (length(notes) <= 4000),
  advice text not null default '' check (length(advice) <= 4000),
  recorded_at timestamptz not null default now(),
  primary key (owner_id, model_version, case_code)
);
alter table public.inspection_reviews enable row level security;
revoke all on public.inspection_reviews from public, anon, authenticated;
grant select, delete on public.inspection_reviews to authenticated;
grant insert (model_version,case_code,status,notes,advice),
      update (status,notes,advice) on public.inspection_reviews to authenticated;
create policy own_reviews on public.inspection_reviews for all to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create function public.stamp_inspection_review() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  new.recorded_at = now();
  return new;
end;
$$;
revoke execute on function public.stamp_inspection_review() from public, anon, authenticated;
create trigger inspection_review_stamp before update on public.inspection_reviews
for each row execute function public.stamp_inspection_review();
commit;
