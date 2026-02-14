-- =============================================
-- Migration: Complete Landlord↔Employee Workflow Fixes
-- Date: 2026-02-15
-- Purpose: Fix all RLS gaps and add maintenance_request_id to message_threads
-- =============================================

-- =============================================
-- 1. EMPLOYEE RLS FIX: Allow employees to UPDATE maintenance requests
-- =============================================
DO $$
BEGIN
  -- Check if policy already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'maintenance_requests' 
      AND policyname = 'maintenance_requests_update_employee'
  ) THEN
    -- Employee can update status/notes on requests assigned to them
    CREATE POLICY "maintenance_requests_update_employee" ON public.maintenance_requests
      FOR UPDATE USING (
        assigned_employee_id IS NOT NULL 
        AND EXISTS (
          SELECT 1 FROM public.employees e
          WHERE e.id = maintenance_requests.assigned_employee_id
            AND e.user_id = auth.uid()
        )
      );
    RAISE NOTICE '✅ Created maintenance_requests_update_employee policy';
  ELSE
    RAISE NOTICE '⚠️ Policy maintenance_requests_update_employee already exists';
  END IF;
END $$;

-- =============================================
-- 2. LANDLORD RLS FIX: Allow landlords to INSERT maintenance requests
-- (They should be able to create requests on behalf of tenants or for their own tracking)
-- =============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'maintenance_requests' 
      AND policyname = 'maintenance_requests_insert_landlord'
  ) THEN
    CREATE POLICY "maintenance_requests_insert_landlord" ON public.maintenance_requests
      FOR INSERT WITH CHECK (
        public.is_property_owner(property_id)
      );
    RAISE NOTICE '✅ Created maintenance_requests_insert_landlord policy';
  ELSE
    RAISE NOTICE '⚠️ Policy maintenance_requests_insert_landlord already exists';
  END IF;
END $$;

-- =============================================
-- 3. ADD maintenance_request_id TO message_threads
-- This enables messaging linked to specific work orders
-- =============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'message_threads' 
      AND column_name = 'maintenance_request_id'
  ) THEN
    ALTER TABLE public.message_threads 
      ADD COLUMN maintenance_request_id uuid REFERENCES public.maintenance_requests(id) ON DELETE SET NULL;
    
    CREATE INDEX IF NOT EXISTS message_threads_maintenance_request_id_idx 
      ON public.message_threads(maintenance_request_id);
    
    RAISE NOTICE '✅ Added maintenance_request_id column to message_threads';
  ELSE
    RAISE NOTICE '⚠️ maintenance_request_id column already exists';
  END IF;
END $$;

-- =============================================
-- 4. HELPER FUNCTION: Check if user is assigned to maintenance request
-- =============================================
CREATE OR REPLACE FUNCTION public.is_maintenance_request_assignee(p_request_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.maintenance_requests mr
    JOIN public.employees e ON e.id = mr.assigned_employee_id
    WHERE mr.id = p_request_id 
      AND e.user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION public.is_maintenance_request_assignee(uuid) TO authenticated;

-- =============================================
-- 5. HELPER FUNCTION: Check if user can access maintenance thread
-- (Either landlord of property OR assigned employee)
-- =============================================
CREATE OR REPLACE FUNCTION public.can_access_maintenance_thread(p_request_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.maintenance_requests mr
    WHERE mr.id = p_request_id 
      AND (
        public.is_property_owner(mr.property_id) 
        OR public.is_maintenance_request_assignee(p_request_id)
      )
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION public.can_access_maintenance_thread(uuid) TO authenticated;

-- =============================================
-- 6. THREAD POLICIES: Allow access to threads linked to maintenance requests
-- =============================================
DO $$
BEGIN
  -- Policy for selecting threads linked to maintenance requests
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'message_threads' 
      AND policyname = 'message_threads_select_maintenance'
  ) THEN
    CREATE POLICY "message_threads_select_maintenance" ON public.message_threads
      FOR SELECT USING (
        maintenance_request_id IS NOT NULL 
        AND public.can_access_maintenance_thread(maintenance_request_id)
      );
    RAISE NOTICE '✅ Created message_threads_select_maintenance policy';
  END IF;

  -- Policy for updating threads linked to maintenance requests  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'message_threads' 
      AND policyname = 'message_threads_update_maintenance'
  ) THEN
    CREATE POLICY "message_threads_update_maintenance" ON public.message_threads
      FOR UPDATE USING (
        maintenance_request_id IS NOT NULL 
        AND public.can_access_maintenance_thread(maintenance_request_id)
      );
    RAISE NOTICE '✅ Created message_threads_update_maintenance policy';
  END IF;
END $$;

-- =============================================
-- 7. ADD created_by COLUMN TO maintenance_requests
-- This tracks who created the request (landlord or tenant)
-- =============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'maintenance_requests' 
      AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.maintenance_requests 
      ADD COLUMN created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
    
    -- Backfill: Set created_by to the tenant's user_id for existing records
    UPDATE public.maintenance_requests mr
    SET created_by = t.user_id
    FROM public.tenants t
    WHERE mr.tenant_id = t.id AND mr.created_by IS NULL;
    
    RAISE NOTICE '✅ Added created_by column to maintenance_requests';
  ELSE
    RAISE NOTICE '⚠️ created_by column already exists';
  END IF;
END $$;

-- =============================================
-- 8. ADD assigned_to COLUMN (nullable, references employees.id)
-- This is an alias/mirror of assigned_employee_id for API consistency
-- NOTE: assigned_employee_id already exists, so we just ensure index
-- =============================================
CREATE INDEX IF NOT EXISTS maintenance_requests_assigned_employee_id_idx 
  ON public.maintenance_requests(assigned_employee_id);

-- =============================================
-- RELOAD SCHEMA CACHE
-- =============================================
NOTIFY pgrst, 'reload schema';

-- =============================================
-- SUMMARY
-- =============================================
DO $$ 
BEGIN
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '✅ WORKFLOW FIXES MIGRATION COMPLETE';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '✅ Employee UPDATE policy on maintenance_requests';
  RAISE NOTICE '✅ Landlord INSERT policy on maintenance_requests';
  RAISE NOTICE '✅ maintenance_request_id on message_threads';
  RAISE NOTICE '✅ Helper functions for maintenance thread access';
  RAISE NOTICE '✅ created_by column for request tracking';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;
