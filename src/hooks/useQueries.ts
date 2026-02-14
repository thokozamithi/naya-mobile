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
 * NOTE: Only queries for tenant users - returns null for landlord/other roles
 */
export const useMembership = () => {
  const { user, activeRole } = useAuth();
  const queryClient = useQueryClient();

  // Only query tenants for tenant role users
  const isTenantRole = activeRole === 'tenant';

  // Get active tenant record
  const { 
    data: tenantRecord, 
    isLoading: membershipLoading,
    refetch: refetchMembership,
    error: membershipError,
    isFetching: membershipFetching
  } = useQuery({
    queryKey: ['tenant-membership', user?.id, activeRole],
    queryFn: async () => {
      if (!user?.id || !isTenantRole) {
        console.log('[useMembership] Skipping query:', { role: activeRole, uid: user?.id, isTenantRole });
        return null;
      }

      console.log('[useMembership] Querying tenants:', { role: activeRole, uid: user?.id });

      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (error) {
        console.error('[useMembership] Error:', { code: error.code, message: error.message, details: error.details });
        throw error;
      }
      
      console.log('[useMembership] Result:', data ? 'Found tenant record' : 'No tenant record');
      return data as TenantMembership | null;
    },
    enabled: !!user?.id,
    staleTime: 0, // Always refetch - critical for join/leave sync
    refetchOnMount: true,
    refetchOnWindowFocus: true,
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
    staleTime: 0,
    refetchOnMount: true,
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
    staleTime: 0,
    refetchOnMount: true,
  });

  // Computed values
  const isJoined = !!tenantRecord?.property_id;
  const isLoading = membershipLoading || (isJoined && (propertyLoading || unitLoading));
  const landlordId = activeProperty?.user_id || null;

  // Refresh function to be called after join/unjoin
  const refreshMembership = useCallback(async () => {
    // Invalidate all tenant-related queries so they refetch with fresh data
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['tenant-membership'] }),
      queryClient.invalidateQueries({ queryKey: ['tenant-active-property'] }),
      queryClient.invalidateQueries({ queryKey: ['tenant-active-unit'] }),
      queryClient.invalidateQueries({ queryKey: ['tenant-lease'] }),
      queryClient.invalidateQueries({ queryKey: ['tenant-maintenance-requests'] }),
      queryClient.invalidateQueries({ queryKey: ['property-messages'] }),
      queryClient.invalidateQueries({ queryKey: ['unread-messages-count'] }),
    ]);

    // Force refetch membership and wait for it to complete
    // Dependent queries (property, unit) will auto-refetch when tenantRecord changes
    const result = await refetchMembership();
    return result;
  }, [queryClient, refetchMembership]);

  return { 
    // Core membership data
    membership: tenantRecord,
    tenantId: tenantRecord?.id || null,
    
    // Computed flags
    isJoined,
    isLoading,
    isFetching: membershipFetching,
    
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

/**
 * usePropertyMessages - Hook to get messages for a specific property
 * Scoped by property_id and user participation
 */
export const usePropertyMessages = () => {
  const { user } = useAuth();
  const { activeProperty } = useMembership();

  return useQuery({
    queryKey: ['property-messages', activeProperty?.id, user?.id],
    queryFn: async () => {
      if (!user?.id || !activeProperty?.id) return [];

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('property_id', activeProperty.id)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && !!activeProperty?.id,
  });
};

/**
 * useSendMessage - Hook to send a message
 * Supports both tenant (uses membership context) and landlord (requires propertyId param)
 */
export const useSendMessage = () => {
  const queryClient = useQueryClient();
  const { user, activeRole } = useAuth();
  const { activeProperty, activeUnit } = useMembership();

  return useMutation({
    mutationFn: async ({ receiverId, content, propertyId, unitId }: { 
      receiverId: string; 
      content: string;
      propertyId?: string;  // Required for landlord, optional for tenant (uses membership)
      unitId?: string | null;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      // Determine property_id - landlord must pass it, tenant uses membership
      const messagePropertyId = propertyId || activeProperty?.id;
      const messageUnitId = unitId !== undefined ? unitId : (activeUnit?.id || null);
      
      if (!messagePropertyId) {
        throw new Error(activeRole === 'landlord' 
          ? 'Property ID required for sending messages' 
          : 'You must be joined to a property to send messages');
      }

      const payload = {
        property_id: messagePropertyId,
        unit_id: messageUnitId,
        sender_id: user.id,
        receiver_id: receiverId,
        content,
      };
      
      console.log('[useSendMessage] Inserting message:', {
        table: 'messages',
        role: activeRole,
        payload: { ...payload, content: content.slice(0, 20) + '...' },
      });

      const { data, error } = await supabase
        .from('messages')
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.error('[useSendMessage] Error:', { code: error.code, message: error.message, details: error.details, hint: error.hint });
        throw error;
      }
      
      console.log('[useSendMessage] Success:', data?.id);
      return data;
    },
    onSuccess: () => {
      // Invalidate both tenant and landlord message queries
      queryClient.invalidateQueries({ queryKey: ['property-messages'] });
      queryClient.invalidateQueries({ queryKey: ['landlord-messages'] });
      queryClient.invalidateQueries({ queryKey: ['landlord-conversations'] });
    },
  });
};

/**
 * useUnreadMessageCount - Hook to get unread message count
 */
export const useUnreadMessageCount = () => {
  const { user } = useAuth();
  const { activeProperty } = useMembership();

  return useQuery({
    queryKey: ['unread-messages-count', activeProperty?.id, user?.id],
    queryFn: async () => {
      if (!user?.id || !activeProperty?.id) return 0;

      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('property_id', activeProperty.id)
        .eq('receiver_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id && !!activeProperty?.id,
  });
};

/**
 * useLandlordProfile - Hook to get landlord profile for messaging
 */
export const useLandlordProfile = () => {
  const { landlordId } = useMembership();

  return useQuery({
    queryKey: ['landlord-profile', landlordId],
    queryFn: async () => {
      if (!landlordId) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('id', landlordId)
        .single();

      if (error) {
        // Profile might not exist, return basic info
        if (error.code === 'PGRST116') return { id: landlordId, full_name: 'Your Landlord', email: '' };
        throw error;
      }
      return data;
    },
    enabled: !!landlordId,
  });
};
