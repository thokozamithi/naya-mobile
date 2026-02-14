-- =============================================
-- Migration: Add landlord SELECT policy for messages
-- Date: 2026-02-14
-- Purpose: Allow landlords to view all messages on their properties
-- =============================================

-- =============================================
-- HELPER FUNCTION: Check if user owns the property of a message
-- =============================================
create or replace function public.is_message_property_owner(p_property_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.properties
    where id = p_property_id and user_id = auth.uid()
  );
$$ language sql security definer stable;

-- =============================================
-- ADD LANDLORD RLS POLICY FOR MESSAGES
-- Property owners can view all messages on their properties
-- =============================================

-- Drop existing policies if they exist (to avoid conflicts)
drop policy if exists "messages_select_landlord" on public.messages;
drop policy if exists "messages_select_own" on public.messages;

-- Recreate base policy: User can see messages they sent or received
create policy "messages_select_own" on public.messages 
  for select using (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );

-- NEW: Property owner can see ALL messages on their properties
create policy "messages_select_landlord" on public.messages
  for select using (
    public.is_message_property_owner(property_id)
  );

-- =============================================
-- GRANTS
-- =============================================
grant execute on function public.is_message_property_owner(uuid) to authenticated;

-- =============================================
-- RELOAD SCHEMA CACHE
-- =============================================
notify pgrst, 'reload schema';

do $$ begin
  raise notice '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  raise notice '✅ LANDLORD MESSAGES RLS POLICY ADDED';
  raise notice '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  raise notice '✅ Landlords can now view messages on their properties';
  raise notice '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
end $$;
