begin;
create table public.inspection_reviews (
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  model_version text not null check (model_version = 'aurea-v03'),
  case_code text not null check (case_code in ('R01','R02','R03','R04','R05')),
  status text not null check (status in ('Não avaliado','Em análise','Avaliado','Requer revisão')),
  notes text not null default '' check (char_length(notes) <= 4000),
  advice text not null default '' check (char_length(advice) <= 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revision uuid not null default gen_random_uuid(),
  primary key (owner_id, model_version, case_code)
);

alter table public.inspection_reviews enable row level security;
revoke all on public.inspection_reviews from public, anon, authenticated;
grant select, delete on public.inspection_reviews to authenticated;
grant insert (model_version, case_code, status, notes, advice),
      update (status, notes, advice) on public.inspection_reviews to authenticated;

create policy own_reviews on public.inspection_reviews for all to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

create function safevision_private.touch_inspection_review() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  new.updated_at = clock_timestamp();
  new.revision = gen_random_uuid();
  return new;
end;
$$;
revoke all on function safevision_private.touch_inspection_review() from public, anon, authenticated;
create trigger touch_inspection_review before update on public.inspection_reviews
for each row execute function safevision_private.touch_inspection_review();
commit;
