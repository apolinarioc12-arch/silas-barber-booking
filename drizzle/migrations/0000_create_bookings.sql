create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  service text not null,
  professional text not null,
  booking_date date not null,
  booking_time time not null,
  client_name text not null,
  client_phone text not null,
  unique (professional, booking_date, booking_time)
);

grant insert on public.bookings to anon;
grant all on public.bookings to service_role;

alter table public.bookings enable row level security;

create policy "anyone can create a booking"
  on public.bookings for insert to anon
  with check (true);

create or replace function public.get_booked_slots(p_date date)
returns table (professional text, booking_time time)
language sql stable security definer set search_path = public
as $$
  select professional, booking_time from public.bookings where booking_date = p_date
$$;

grant execute on function public.get_booked_slots(date) to anon;