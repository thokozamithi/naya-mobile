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
  created_at: string;
  updated_at: string;
}

export interface Unit {
  id: string;
  property_id: string;
  unit_name: string;
  unit_code: string;
  status: string;
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
