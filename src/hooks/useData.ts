import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';
import { useAuth } from './useAuth';

// Types
export interface Property {
  id: string;
  user_id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  property_type: string;
  total_units: number;
  description: string | null;
  photos: string[] | null;
  property_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface Unit {
  id: string;
  property_id: string;
  unit_name: string;
  unit_code: string;
  status: string;
  bedrooms: number | null;
  bathrooms: number | null;
  square_feet: number | null;
  monthly_rent: number | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: string;
  budget: number | null;
  progress: number;
  property_id: string | null;
  photos: string[] | null;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  property_id: string;
  unit_id: string | null;
  tenant_id: string;
  assigned_employee_id: string | null;
  photo_urls: string[] | null;
  notes: string | null;
  work_order_code: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface Specialist {
  id: string;
  user_id: string;
  name: string;
  specialties: string[];
  bio: string | null;
  rating: number | null;
  review_count: number | null;
  hourly_rate: number | null;
  phone: string | null;
  email: string;
  location: string | null;
  profile_photo: string | null;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  property_id: string;
  unit_id: string | null;
  amount: number;
  payment_type: string;
  payment_method: string | null;
  status: string;
  due_date: string;
  paid_date: string | null;
  payment_period: string | null;
  transaction_id: string | null;
  notes: string | null;
  receipt_url: string | null;
  created_at: string;
  updated_at: string;
}

// Property hooks
export const useProperties = () => {
  const { user, activeRole } = useAuth();

  const { data: properties, isLoading, error } = useQuery({
    queryKey: ['properties', user?.id],
    queryFn: async () => {
      if (!user?.id || (activeRole !== 'landlord' && activeRole !== 'builder')) return [];

      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Property[];
    },
    enabled: !!user?.id,
  });

  return { properties, isLoading, error };
};

export const usePropertyDetail = (propertyId: string | null | undefined) => {
  const { data: property, isLoading, error } = useQuery({
    queryKey: ['property', propertyId],
    queryFn: async () => {
      if (!propertyId) return null;

      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single();

      if (error) throw error;
      return data as Property;
    },
    enabled: !!propertyId,
  });

  const { data: units } = useQuery({
    queryKey: ['property-units', propertyId],
    queryFn: async () => {
      if (!propertyId) return [];

      const { data, error } = await supabase
        .from('units')
        .select('*')
        .eq('property_id', propertyId);

      if (error) throw error;
      return data as Unit[];
    },
    enabled: !!propertyId,
  });

  return { property, units, isLoading, error };
};

// Units hook
export const useUnits = (propertyId: string) => {
  return useQuery({
    queryKey: ['units', propertyId],
    queryFn: async () => {
      if (!propertyId) return [];

      const { data, error} = await supabase
        .from('units')
        .select('*')
        .eq('property_id', propertyId)
        .order('unit_name', { ascending: true });

      if (error) throw error;
      return data as Unit[];
    },
    enabled: !!propertyId,
  });
};

// Tenant property hook
export const useTenantProperty = () => {
  const { user, activeRole } = useAuth();

  const { data: tenantData, isLoading: tenantLoading } = useQuery({
    queryKey: ['tenant', user?.id],
    queryFn: async () => {
      if (!user?.id || activeRole !== 'tenant') return null;

      const { data, error } = await supabase
        .from('tenants')
        .select('property_id, unit_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (error) {
        // Tenant hasn't joined a property yet
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data;
    },
    enabled: !!user?.id && activeRole === 'tenant',
  });

  const { data: property, isLoading: propertyLoading } = useQuery({
    queryKey: ['tenant-property', tenantData?.property_id],
    queryFn: async () => {
      if (!tenantData?.property_id) return null;

      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', tenantData.property_id)
        .single();

      if (error) throw error;
      return data as Property;
    },
    enabled: !!tenantData?.property_id,
  });

  const { data: unit, isLoading: unitLoading } = useQuery({
    queryKey: ['tenant-unit', tenantData?.unit_id],
    queryFn: async () => {
      if (!tenantData?.unit_id) return null;

      const { data, error } = await supabase
        .from('units')
        .select('*')
        .eq('id', tenantData.unit_id)
        .single();

      if (error) throw error;
      return data as Unit;
    },
    enabled: !!tenantData?.unit_id,
  });

  return {
    property,
    unit,
    isLoading: tenantLoading || propertyLoading || unitLoading,
    hasProperty: !!tenantData?.property_id,
  };
};

// Project hooks
export const useProjects = () => {
  const { user, activeRole } = useAuth();

  const { data: projects, isLoading, error } = useQuery({
    queryKey: ['projects', user?.id],
    queryFn: async () => {
      if (!user?.id || (activeRole !== 'builder' && activeRole !== 'employee')) return [];

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Project[];
    },
    enabled: !!user?.id,
  });

  return { projects, isLoading, error };
};

export const useProjectDetail = (projectId: string | null | undefined) => {
  const { data: project, isLoading, error } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      if (!projectId) return null;

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      return data as Project;
    },
    enabled: !!projectId,
  });

  return { project, isLoading, error };
};

// Maintenance and requests
export const useMaintenanceRequests = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['maintenanceRequests', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maintenance_requests')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
};

export const usePropertyRequests = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['propertyRequests', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('property_requests')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
};

// Messaging
export const useMessages = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['messages', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
};

// Specialists
export const useSpecialists = () => {
  return useQuery({
    queryKey: ['specialists'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('specialists')
        .select('*')
        .eq('verified', true);

      if (error) throw error;
      return data || [];
    },
    staleTime: 30 * 60 * 1000, // Specialists rarely change, cache for 30min
  });
};

// Payments
export const usePayments = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['payments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Payment[];
    },
    enabled: !!user?.id,
  });
};

export const usePropertyPayments = (propertyId: string | null | undefined) => {
  return useQuery({
    queryKey: ['property-payments', propertyId],
    queryFn: async () => {
      if (!propertyId) return [];

      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Payment[];
    },
    enabled: !!propertyId,
  });
};

// Employees
export const useEmployees = () => {
  return useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .eq('role', 'employee')
        .order('full_name', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};

// =============================================
// MUTATIONS
// =============================================

// Property mutations
export const useCreateProperty = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (property: Omit<Property, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('properties')
        .insert(property)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties', user?.id] });
    },
  });
};

export const useUpdateProperty = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Property> & { id: string }) => {
      const { data, error } = await supabase
        .from('properties')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['properties', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['property', data.id] });
    },
  });
};

export const useDeleteProperty = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (propertyId: string) => {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties', user?.id] });
    },
  });
};

// Unit mutations
export const useCreateUnit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (unit: Omit<Unit, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('units')
        .insert(unit)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['property-units', data.property_id] });
      queryClient.invalidateQueries({ queryKey: ['property', data.property_id] });
    },
  });
};

export const useUpdateUnit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Unit> & { id: string }) => {
      const { data, error } = await supabase
        .from('units')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['property-units', data.property_id] });
      queryClient.invalidateQueries({ queryKey: ['property', data.property_id] });
    },
  });
};

// Maintenance request mutations
export const useCreateMaintenanceRequest = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (request: Omit<MaintenanceRequest, 'id' | 'created_at' | 'updated_at' | 'work_order_code'>) => {
      const { data, error } = await supabase
        .from('maintenance_requests')
        .insert(request)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenanceRequests', user?.id] });
    },
  });
};

export const useUpdateMaintenanceRequest = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MaintenanceRequest> & { id: string }) => {
      const { data, error } = await supabase
        .from('maintenance_requests')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenanceRequests', user?.id] });
    },
  });
};

// Payment mutations
export const useCreatePayment = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (payment: Omit<Payment, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('payments')
        .insert(payment)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', user?.id] });
    },
  });
};

export const useUpdatePayment = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Payment> & { id: string }) => {
      const { data, error } = await supabase
        .from('payments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payments', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['property-payments', data.property_id] });
    },
  });
};
