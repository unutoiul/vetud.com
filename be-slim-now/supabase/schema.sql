-- BeSlimNow database (Supabase project "BeSlimNow", ref zejuvarigrsiizeoaqew, us-east-1).
-- Applied on 2026-11-23 as migration "subscribers_and_orders". Kept here for reference and to
-- rebuild the tables in another project.
--
-- People who took the "extra 10%" code, and every order placed on the page. Written only by the
-- site's server with the secret key (src/lib/db.ts). Row level security is on with no policies, so
-- the public (anon/publishable) key can neither read nor write these tables.

create table public.subscribers (
  id bigint generated always as identity primary key,
  email text not null unique check (email = lower(email) and position('@' in email) > 1),
  country text check (country is null or country ~ '^[A-Z]{2}$'),
  source text not null default 'promo-popup',
  subscribed_at timestamptz not null default now(),
  -- Updated each time the same address asks for the code again.
  last_seen_at timestamptz not null default now(),
  times_subscribed integer not null default 1
);
comment on table public.subscribers is 'Emails from the "extra 10%" pop-up (one row per address).';

create table public.orders (
  id bigint generated always as identity primary key,
  order_number text not null unique,
  placed_at timestamptz not null default now(),
  status text not null default 'awaiting_payment'
    check (status in ('awaiting_payment', 'paid', 'shipped', 'cancelled')),
  product text not null check (product in ('tz2', 'retatrutide')),
  strength text not null check (strength in ('20mg', '40mg')),
  quantity integer not null check (quantity between 1 and 100),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  unit_regular numeric(12, 2) not null,
  unit_price numeric(12, 2) not null,
  regular_total numeric(12, 2) not null,
  subtotal numeric(12, 2) not null,
  code_discount numeric(12, 2) not null default 0,
  total numeric(12, 2) not null,
  promo_code text,
  name text not null,
  email text not null,
  phone text not null,
  contact_app text not null,
  contact_handle text,
  country text not null check (country ~ '^[A-Z]{2}$'),
  address text not null,
  city text not null,
  postal_code text not null,
  note text,
  research_use_confirmed boolean not null,
  -- Whether the buyer's confirmation email went out (false = follow up by hand).
  confirmation_sent boolean not null default false
);
comment on table public.orders is 'Every order from the BeSlimNow page. Change status by hand as payment arrives and parcels ship.';

create index orders_placed_at_idx on public.orders (placed_at desc);
create index orders_email_idx on public.orders (email);
create index orders_status_idx on public.orders (status);

alter table public.subscribers enable row level security;
alter table public.orders enable row level security;

-- Re-subscribing an address bumps its counters instead of failing on the unique email.
create or replace function public.upsert_subscriber(p_email text, p_country text, p_source text default 'promo-popup')
returns void
language sql
security invoker
set search_path = ''
as $$
  insert into public.subscribers (email, country, source)
  values (lower(p_email), nullif(upper(p_country), ''), coalesce(p_source, 'promo-popup'))
  on conflict (email) do update
    set last_seen_at = now(),
        times_subscribed = public.subscribers.times_subscribed + 1,
        country = coalesce(excluded.country, public.subscribers.country);
$$;
revoke all on function public.upsert_subscriber(text, text, text) from public, anon, authenticated;
grant execute on function public.upsert_subscriber(text, text, text) to service_role;
