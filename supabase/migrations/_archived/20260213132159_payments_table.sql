-- Payments table for rent and other property-related payments
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  property_id uuid references public.properties(id) on delete cascade not null,
  unit_id uuid references public.units(id) on delete set null,

  -- Payment details
  amount decimal(10, 2) not null check (amount > 0),
  payment_type text not null default 'rent' check (payment_type in ('rent', 'deposit', 'late_fee', 'maintenance', 'other')),
  payment_method text check (payment_method in ('credit_card', 'debit_card', 'bank_transfer', 'cash', 'check', 'other')),
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed', 'refunded')),

  -- Dates and period
  due_date date not null,
  paid_date timestamptz,
  payment_period text, -- e.g., "March 2026" for rent payments

  -- Transaction info
  transaction_id text, -- External payment processor transaction ID
  notes text,
  receipt_url text,

  -- Timestamps
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add indexes for common queries
create index if not exists payments_user_id_idx on public.payments(user_id);
create index if not exists payments_property_id_idx on public.payments(property_id);
create index if not exists payments_status_idx on public.payments(status);
create index if not exists payments_due_date_idx on public.payments(due_date);
create index if not exists payments_created_at_idx on public.payments(created_at desc);

-- Enable Row Level Security
alter table public.payments enable row level security;

-- RLS Policies
-- Tenants can view their own payments
create policy "Tenants can view their own payments"
  on public.payments for select
  using (auth.uid() = user_id);

-- Tenants can create their own payments
create policy "Tenants can create their own payments"
  on public.payments for insert
  with check (auth.uid() = user_id);

-- Tenants can update their own pending payments
create policy "Tenants can update their own pending payments"
  on public.payments for update
  using (auth.uid() = user_id and status = 'pending');

-- Landlords can view payments for their properties
create policy "Landlords can view payments for their properties"
  on public.payments for select
  using (
    exists (
      select 1 from public.properties
      where properties.id = payments.property_id
      and properties.user_id = auth.uid()
    )
  );

-- Landlords can update payment status for their properties
create policy "Landlords can update payments for their properties"
  on public.payments for update
  using (
    exists (
      select 1 from public.properties
      where properties.id = payments.property_id
      and properties.user_id = auth.uid()
    )
  );

-- Auto-update updated_at timestamp
create or replace function public.update_payments_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_payments_updated_at
  before update on public.payments
  for each row
  execute function public.update_payments_updated_at();

-- Comment on table
comment on table public.payments is 'Tracks rent payments and other property-related transactions';
