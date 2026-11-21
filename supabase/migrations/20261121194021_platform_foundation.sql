create schema if not exists safevision_private;
revoke all on schema safevision_private from public, anon, authenticated;

create table public.profiles (
  id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 100)
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  description text not null default '' check (char_length(description) <= 2000),
  model_object_key text check (model_object_key is null or char_length(model_object_key) between 1 and 512),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index projects_owner_recent on public.projects (owner_id, updated_at desc, id);

create table public.project_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text not null,
  model_object_key text,
  recorded_at timestamptz not null default now()
);
create index project_versions_recent on public.project_versions (project_id, recorded_at desc);

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_versions enable row level security;
revoke all on public.profiles, public.projects, public.project_versions from public, anon, authenticated;
grant select on public.profiles, public.projects, public.project_versions to authenticated;
grant insert (display_name), update (display_name) on public.profiles to authenticated;
grant insert (title, description), update (title, description), delete on public.projects to authenticated;

create policy profile_read on public.profiles for select to authenticated
  using (id = (select auth.uid()));
create policy profile_create on public.profiles for insert to authenticated
  with check (id = (select auth.uid()));
create policy profile_edit on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy project_read on public.projects for select to authenticated
  using (owner_id = (select auth.uid()));
create policy project_create on public.projects for insert to authenticated
  with check (owner_id = (select auth.uid()));
create policy project_edit on public.projects for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy project_delete on public.projects for delete to authenticated
  using (owner_id = (select auth.uid()));
create policy history_read on public.project_versions for select to authenticated
  using (exists (
    select 1 from public.projects p
    where p.id = project_id and p.owner_id = (select auth.uid())
  ));

create function safevision_private.touch_project() returns trigger
language plpgsql set search_path = '' as $$
begin
  if row(new.title, new.description, new.model_object_key)
      is distinct from row(old.title, old.description, old.model_object_key) then
    new.updated_at = now();
  end if;
  return new;
end;
$$;

-- Only the database trigger can write the history. No client RPC or grants.
create function safevision_private.record_project_version() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.project_versions (project_id, title, description, model_object_key)
  values (new.id, new.title, new.description, new.model_object_key);
  return new;
end;
$$;
revoke execute on function safevision_private.touch_project() from public, anon, authenticated;
revoke execute on function safevision_private.record_project_version() from public, anon, authenticated;

create trigger touch_project before update of title, description, model_object_key on public.projects
  for each row execute function safevision_private.touch_project();
create trigger record_new_project after insert on public.projects
  for each row execute function safevision_private.record_project_version();
create trigger record_project_edit after update of title, description, model_object_key on public.projects
  for each row when ((old.title, old.description, old.model_object_key)
      is distinct from (new.title, new.description, new.model_object_key))
  execute function safevision_private.record_project_version();
