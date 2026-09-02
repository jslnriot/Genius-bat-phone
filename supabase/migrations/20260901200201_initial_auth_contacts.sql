create schema if not exists private;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  phone_number text,
  created_at timestamptz not null default now()
);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  phone_number text not null,
  created_at timestamptz not null default now()
);

create table public.calls (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id),
  contact_id uuid references public.contacts (id) on delete set null,
  contact_name_snapshot text,
  destination_number text,
  twilio_call_sid text unique,
  status text,
  start_time timestamptz,
  duration integer,
  recording_url text,
  transcript text,
  created_at timestamptz not null default now()
);

create index contacts_user_id_idx on public.contacts (user_id);
create index calls_user_id_idx on public.calls (user_id);
create index calls_contact_id_idx on public.calls (contact_id);

alter table public.profiles enable row level security;
alter table public.contacts enable row level security;
alter table public.calls enable row level security;

create policy "profiles_select_own"
on public.profiles for select
to authenticated
using ((select auth.uid()) = id);

create policy "profiles_insert_own"
on public.profiles for insert
to authenticated
with check ((select auth.uid()) = id);

create policy "profiles_update_own"
on public.profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "profiles_delete_own"
on public.profiles for delete
to authenticated
using ((select auth.uid()) = id);

create policy "contacts_select_own"
on public.contacts for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "contacts_insert_own"
on public.contacts for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "contacts_update_own"
on public.contacts for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "contacts_delete_own"
on public.contacts for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "calls_select_own"
on public.calls for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "calls_insert_own"
on public.calls for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "calls_update_own"
on public.calls for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "calls_delete_own"
on public.calls for delete
to authenticated
using ((select auth.uid()) = user_id);

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.contacts to authenticated;
grant select, insert, update, delete on public.calls to authenticated;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

insert into public.profiles (id, email)
select id, email
from auth.users
on conflict (id) do nothing;
