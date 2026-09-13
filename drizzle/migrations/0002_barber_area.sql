-- Roles
create type public.app_role as enum ('owner', 'barber');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "usuario ve seus papeis" on public.user_roles
  for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(), 'owner'));

-- Barbeiros
create table public.barbers (
  id uuid primary key,
  name text not null,
  active boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index barbers_name_key on public.barbers (lower(name));

grant select on public.barbers to anon;
grant select, insert, update, delete on public.barbers to authenticated;
grant all on public.barbers to service_role;
alter table public.barbers enable row level security;

create policy "barbeiros ativos sao publicos" on public.barbers
  for select to anon using (active);
create policy "autenticado ve barbeiros" on public.barbers
  for select to authenticated using (true);
create policy "barbeiro edita seu perfil" on public.barbers
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "dono gerencia barbeiros" on public.barbers
  for all to authenticated using (public.has_role(auth.uid(), 'owner')) with check (public.has_role(auth.uid(), 'owner'));

-- Horarios individuais
create table public.barber_schedules (
  id uuid primary key default gen_random_uuid(),
  barber_id uuid not null references public.barbers(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  works boolean not null default true,
  start_time time not null default '09:00',
  end_time time not null default '20:00',
  lunch_start time,
  lunch_end time,
  unique (barber_id, weekday)
);

grant select on public.barber_schedules to anon;
grant select, insert, update, delete on public.barber_schedules to authenticated;
grant all on public.barber_schedules to service_role;
alter table public.barber_schedules enable row level security;

create policy "horarios sao publicos" on public.barber_schedules
  for select to anon using (true);
create policy "autenticado ve horarios" on public.barber_schedules
  for select to authenticated using (true);
create policy "barbeiro gerencia seus horarios" on public.barber_schedules
  for all to authenticated using (barber_id = auth.uid()) with check (barber_id = auth.uid());
create policy "dono gerencia horarios" on public.barber_schedules
  for all to authenticated using (public.has_role(auth.uid(), 'owner')) with check (public.has_role(auth.uid(), 'owner'));

-- Agendamentos: vinculo com barbeiro e status
alter table public.bookings add column if not exists barber_id uuid references public.barbers(id) on delete set null;
alter table public.bookings add column if not exists status text not null default 'confirmado';

grant select, insert, update, delete on public.bookings to authenticated;
grant all on public.bookings to service_role;

create policy "barbeiro ve sua agenda" on public.bookings
  for select to authenticated
  using (
    public.has_role(auth.uid(), 'owner')
    or barber_id = auth.uid()
    or lower(professional) = (select lower(name) from public.barbers where id = auth.uid())
  );

create policy "barbeiro gerencia sua agenda" on public.bookings
  for update to authenticated
  using (
    public.has_role(auth.uid(), 'owner')
    or barber_id = auth.uid()
    or lower(professional) = (select lower(name) from public.barbers where id = auth.uid())
  )
  with check (true);

create policy "barbeiro apaga sua agenda" on public.bookings
  for delete to authenticated
  using (
    public.has_role(auth.uid(), 'owner')
    or barber_id = auth.uid()
    or lower(professional) = (select lower(name) from public.barbers where id = auth.uid())
  );

create policy "barbeiro cria agendamento" on public.bookings
  for insert to authenticated with check (true);

-- Criacao da conta do barbeiro (primeiro cadastro vira dono)
create or replace function public.claim_barber_account(p_name text)
returns public.barbers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_has_owner boolean;
  v_row public.barbers;
begin
  if v_user is null then
    raise exception 'Nao autenticado';
  end if;

  select exists (select 1 from public.user_roles where role = 'owner') into v_has_owner;

  insert into public.barbers (id, name, active)
  values (v_user, p_name, not v_has_owner)
  on conflict (id) do update set name = excluded.name
  returning * into v_row;

  insert into public.user_roles (user_id, role)
  values (v_user, case when v_has_owner then 'barber'::public.app_role else 'owner'::public.app_role end)
  on conflict do nothing;

  insert into public.barber_schedules (barber_id, weekday, works, start_time, end_time, lunch_start, lunch_end)
  select v_user, d,
    case when d = 1 then false else true end,
    case when d = 0 then time '09:00' else time '09:00' end,
    case when d = 0 then time '14:00' else time '20:00' end,
    case when d = 0 then null else time '12:00' end,
    case when d = 0 then null else time '13:00' end
  from generate_series(0, 6) as d
  on conflict (barber_id, weekday) do nothing;

  return v_row;
end;
$$;

grant execute on function public.claim_barber_account(text) to authenticated;