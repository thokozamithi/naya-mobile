import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';
import { useAuth } from './useAuth';
import { useCallback } from 'react';

// Types for tenant context
export interface TenantMembership {
  id: string;
  user_id: string;
  property_id: string;
  unit_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  status: string;
  created_at: string;
}

export interface ActiveProperty {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  user_id: string; // landlord's user_id
}

export interface ActiveUnit {
  id: string;
  unit_name: string;
  unit_code: string;
  monthly_rent: number | null;
  status: string;
}

/**
 * useMembership - Single source of truth for tenant's active membership
 * Loads the tenant's active membership (unit_id, property_id, role)
 * Refreshes on app launch, after join success, and on screen focus
 */
export const useMembership = () => {
  const { user, activeRole } = useAuth();
  const queryClient = useQueryClient();

  // Get active tenant record
  const { 
    data: tenantRecord, 
    isLoading: membershipLoading,
    refetch: refetchMembership,
    error: membershipError
  } = useQuery({
    queryKey: ['tenant-membership', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (error) {
        // No active tenant record = not joined
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data as TenantMembership;
    },
    enabled: !!user?.id,
    staleTime: 30000, // Consider fresh for 30 seconds
  });

  // Get associated property
  const { data: activeProperty, isLoading: propertyLoading } = useQuery({
    queryKey: ['tenant-active-property', tenantRecord?.property_id],
    queryFn: async () => {
      if (!tenantRecord?.property_id) return null;

      const { data, error } = await supabase
        .from('properties')
        .select('id, name, address, city, state, zip, user_id')
        .eq('id', tenantRecord.property_id)
        .single();

      if (error) throw error;
      return data as ActiveProperty;
    },
    enabled: !!tenantRecord?.property_id,
  });

  // Get associated unit
  const { data: activeUnit, isLoading: unitLoading } = useQuery({
    queryKey: ['tenant-active-unit', tenantRecord?.unit_id],
    queryFn: async () => {
      if (!tenantRecord?.unit_id) return null;

      const { data, error } = await supabase
        .from('units')
        .select('id, unit_name, unit_code, monthly_rent, status')
        .eq('id', tenantRecord.unit_id)
        .single();

      if (error) throw error;
      return data as ActiveUnit;
    },
    enabled: !!tenantRecord?.unit_id,
  });

  // Computed values
  const isJoined = !!tenantRecord?.property_id;
  const isLoading = membershipLoading || (isJoined && (propertyLoading || unitLoading));
  const landlordId = activeProperty?.user_id || null;

  // Refresh function to be called after join/unjoin
  const refreshMembership = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['tenant-membership'] });
    await queryClient.invalidateQueries({ queryKey: ['tenant-active-property'] });
    await queryClient.invalidateQueries({ queryKey: ['tenant-active-unit'] });
    await queryClient.invalidateQueries({ queryKey: ['tenant'] });
    await queryClient.invalidateQueries({ queryKey: ['tenant-property'] });
    return refetchMembership();
  }, [queryClient, refetchMembership]);

  return { 
    // Core membership data
    membership: tenantRecord,
    tenantId: tenantRecord?.id || null,
    
    // Computed flags
    isJoined,
    isLoading,
    
    // Related data
    activeProperty,
    activeUnit,
    landlordId,
    
    // Actions
    refreshMembership,
    
    // Legacy compatibility
    status: tenantRecord?.status || 'none',
  };
};

export const useSubscription = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: subscription, isLoading } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  return { subscription, isLoading };
};

export const useUserProfile = () => {
  const { user } = useAuth();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  return { profile, isLoading };
};

/**
 * useLeaveUnit - Hook to leave/unjoin a unit
 * Soft deletes the tenant record (sets status to 'inactive')
 */
export const useLeaveUnit = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');

      // Call RPC function to leave unit
      const { data, error } = await supabase.rpc('leave_unit');

      if (error) throw error;
      
      const result = data as { success: boolean; error?: string };
      if (!result.success) {
        throw new Error(result.error || 'Failed to leave unit');
      }
      
      return result;
    },
    onSuccess: () => {
      // Invalidate all tenant-related queries
      queryClient.invalidateQueries({ queryKey: ['tenant-membership'] });
      queryClient.invalidateQueries({ queryKey: ['tenant-active-property'] });
      queryClient.invalidateQueries({ queryKey: ['tenant-active-unit'] });
      queryClient.invalidateQueries({ queryKey: ['tenant'] });
      queryClient.invalidateQueries({ queryKey: ['tenant-property'] });
      queryClient.invalidateQueries({ queryKey: ['tenant-unit'] });
      queryClient.invalidateQueries({ queryKey: ['units'] });
    },
  });
};

/**
 * useTenantLease - Hook to get the tenant's lease
 */
export const useTenantLease = () => {
  const { tenantId, activeProperty, activeUnit } = useMembership();

  return useQuery({
    queryKey: ['tenant-lease', tenantId],
    queryFn: async () => {
      if (!tenantId) return null;

      const { data, error } = await supabase
        .from('leases')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('status', 'active')
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // No lease found
        throw error;
      }
      return data;
    },
    enabled: !!tenantId,
  });
};

/**
 * useTenantMaintenanceRequests - Hook to get tenant's maintenance requests
 * Uses tenant_id from the tenants table, not user_id
 */
export const useTenantMaintenanceRequests = () => {
  const { tenantId, activeProperty } = useMembership();

  return useQuery({
    queryKey: ['tenant-maintenance-requests', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];

      const { data, error } = await supabase
        .from('maintenance_requests')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenantId,
  });
};

/**
 * useCreateTenantMaintenanceRequest - Create maintenance request with tenant context
 */
export const useCreateTenantMaintenanceRequest = () => {
  const queryClient = useQueryClient();
  const { tenantId, activeProperty, activeUnit } = useMembership();

  return useMutation({
    mutationFn: async (request: { title: string; description: string; priority: string }) => {
      if (!tenantId || !activeProperty?.id) {
        throw new Error('You must be joined to a property to create maintenance requests');
      }

      const { data, error } = await supabase
        .from('maintenance_requests')
        .insert({
          property_id: activeProperty.id,
          unit_id: activeUnit?.id || null,
          tenant_id: tenantId,
          title: request.title,
          description: request.description,
          priority: request.priority,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-maintenance-requests'] });
      queryClient.invalidateQueries({ queryKey: ['maintenanceRequests'] });
    },
  });
};

/**
 * usePropertyMaintenanceRequests - Hook for landlord to get property maintenance requests
 */
export const usePropertyMaintenanceRequests = (propertyId: string | null) => {
  return useQuery({
    queryKey: ['property-maintenance-requests', propertyId],
    queryFn: async () => {
      if (!propertyId) return [];

      const { data, error } = await supabase
        .from('maintenance_requests')
        .select(`
          *,
          unit:units(unit_name),
          tenant:tenants(full_name, email)
        `)
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!propertyId,
  });
};
