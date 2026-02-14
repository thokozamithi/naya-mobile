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
  unit_join_code: string;
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
  landlord_id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  budget: number | null;
  progress: number;
  property_id: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
  // Joined relations
  property?: { id: string; name: string } | null;
  assignments?: ProjectAssignment[];
}

export interface ProjectAssignment {
  id: string;
  project_id: string;
  employee_id: string;
  role: string;
  assigned_at: string;
  employee?: Employee;
}

export interface Employee {
  id: string;
  user_id: string;
  landlord_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectUpdate {
  id: string;
  project_id: string;
  author_id: string;
  note: string | null;
  status_change: string | null;
  progress_change: number | null;
  created_at: string;
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
  user_id: string | null;
  name: string;
  trade: string;
  specialties: string[];
  bio: string | null;
  rating: number | null;
  review_count: number | null;
  hourly_rate: number | null;
  phone: string | null;
  email: string | null;
  location: string | null;
  profile_photo: string | null;
  verified: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface MessageThread {
  id: string;
  subject: string | null;
  property_id: string | null;
  project_id: string | null;
  last_message_at: string;
  created_at: string;
  // Joined
  participants?: ThreadParticipant[];
  lastMessage?: ThreadMessage | null;
}

export interface ThreadParticipant {
  id: string;
  thread_id: string;
  user_id: string;
  role: string;
  last_read_at: string | null;
  created_at: string;
}

export interface ThreadMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  created_at: string;
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
// For landlord: get all projects they own
export const useLandlordProjects = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['landlord-projects', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          property:properties(id, name),
          assignments:project_assignments(
            id, employee_id, role, assigned_at,
            employee:employees(id, full_name, email, status)
          )
        `)
        .eq('landlord_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[useLandlordProjects] Error:', error);
        throw error;
      }
      return (data || []) as Project[];
    },
    enabled: !!user?.id,
  });
};

// For employee: get projects assigned to them
export const useEmployeeProjects = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['employee-projects', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // First get the employee record
      const { data: empRecord, error: empError } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (empError) {
        console.error('[useEmployeeProjects] Employee lookup error:', empError);
        throw empError;
      }
      if (!empRecord || empRecord.length === 0) return [];

      const employeeIds = empRecord.map((e: any) => e.id);

      // Get assignments for this employee
      const { data: assignments, error: assError } = await supabase
        .from('project_assignments')
        .select('project_id')
        .in('employee_id', employeeIds);

      if (assError) throw assError;
      if (!assignments || assignments.length === 0) return [];

      const projectIds = [...new Set(assignments.map((a: any) => a.project_id))];

      // Get the actual projects
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          property:properties(id, name)
        `)
        .in('id', projectIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Project[];
    },
    enabled: !!user?.id,
  });
};

// Legacy compat - routes to the right hook based on role
export const useProjects = () => {
  const { user, activeRole } = useAuth();
  const landlordQuery = useLandlordProjects();
  const employeeQuery = useEmployeeProjects();

  if (activeRole === 'landlord') {
    return { projects: landlordQuery.data || [], isLoading: landlordQuery.isLoading, error: landlordQuery.error };
  }
  if (activeRole === 'employee') {
    return { projects: employeeQuery.data || [], isLoading: employeeQuery.isLoading, error: employeeQuery.error };
  }
  return { projects: [], isLoading: false, error: null };
};

export const useProjectDetail = (projectId: string | null | undefined) => {
  const { data: project, isLoading, error, refetch } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      if (!projectId) return null;

      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          property:properties(id, name),
          assignments:project_assignments(
            id, employee_id, role, assigned_at,
            employee:employees(id, full_name, email, status)
          )
        `)
        .eq('id', projectId)
        .single();

      if (error) throw error;
      return data as Project;
    },
    enabled: !!projectId,
  });

  return { project, isLoading, error, refetch };
};

// Project updates (activity log)
export const useProjectUpdates = (projectId: string | null | undefined) => {
  return useQuery({
    queryKey: ['project-updates', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from('project_updates')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as ProjectUpdate[];
    },
    enabled: !!projectId,
  });
};

// Maintenance and requests - For landlords: get all requests for their properties
export const useMaintenanceRequests = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['maintenanceRequests', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      // First get landlord's property IDs
      const { data: properties, error: propError } = await supabase
        .from('properties')
        .select('id')
        .eq('user_id', userId);
      
      if (propError) throw propError;
      if (!properties || properties.length === 0) return [];
      
      const propertyIds = properties.map((p: any) => p.id);
      
      // Then get all maintenance requests for those properties
      const { data, error } = await supabase
        .from('maintenance_requests')
        .select(`
          *,
          unit:units(unit_name),
          tenant:tenants(full_name, email)
        `)
        .in('property_id', propertyIds)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching maintenance requests:', { code: error.code, message: error.message, details: error.details });
        throw error;
      }
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

// Landlord Messages - Get all messages for properties landlord owns
export const useLandlordMessages = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['landlord-messages', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // First get landlord's property IDs
      const { data: properties, error: propError } = await supabase
        .from('properties')
        .select('id, name')
        .eq('user_id', user.id);
      
      if (propError) {
        console.error('Error fetching properties for messages:', propError);
        throw propError;
      }
      if (!properties || properties.length === 0) return [];
      
      const propertyIds = properties.map((p: any) => p.id);
      
      // Get all messages for those properties, with related data
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          property:properties(id, name),
          unit:units(id, unit_name)
        `)
        .in('property_id', propertyIds)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching landlord messages:', { code: error.code, message: error.message, details: error.details });
        throw error;
      }
      return data || [];
    },
    enabled: !!user?.id,
  });
};

// Landlord Conversations - Group messages by property/unit/sender for conversation list
export interface LandlordConversation {
  id: string;
  propertyId: string;
  propertyName: string;
  unitId: string | null;
  unitName: string | null;
  tenantId: string;
  tenantName: string | null;
  lastMessage: any;
  unreadCount: number;
  messages: any[];
}

export const useLandlordConversations = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['landlord-conversations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // Get landlord's property IDs
      const { data: properties, error: propError } = await supabase
        .from('properties')
        .select('id, name')
        .eq('user_id', user.id);
      
      if (propError) throw propError;
      if (!properties || properties.length === 0) return [];
      
      const propertyIds = properties.map((p: any) => p.id);
      const propertyMap = new Map<string, string>(properties.map((p: any) => [p.id, p.name]));
      
      // Get all messages for those properties
      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          *,
          unit:units(id, unit_name)
        `)
        .in('property_id', propertyIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!messages || messages.length === 0) return [];
      
      // Group by property + sender (tenant)
      const conversationMap = new Map<string, LandlordConversation>();
      
      for (const msg of messages) {
        // The "other" party is whoever isn't the landlord
        const tenantId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        const key = `${msg.property_id}-${tenantId}`;
        
        if (!conversationMap.has(key)) {
          conversationMap.set(key, {
            id: key,
            propertyId: msg.property_id,
            propertyName: (propertyMap.get(msg.property_id) || 'Unknown Property') as string,
            unitId: msg.unit_id,
            unitName: msg.unit?.unit_name || null,
            tenantId,
            tenantName: null, // Will be populated by UI if needed
            lastMessage: msg,
            unreadCount: msg.receiver_id === user.id && !msg.is_read ? 1 : 0,
            messages: [msg],
          });
        } else {
          const conv = conversationMap.get(key)!;
          conv.messages.push(msg);
          if (msg.receiver_id === user.id && !msg.is_read) {
            conv.unreadCount++;
          }
        }
      }
      
      // Convert to array and sort by last message
      return Array.from(conversationMap.values())
        .sort((a, b) => new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime());
    },
    enabled: !!user?.id,
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

// Employees - landlord's team members
export const useLandlordEmployees = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['landlord-employees', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('landlord_id', user.id)
        .order('full_name', { ascending: true });

      if (error) {
        console.error('[useLandlordEmployees] Error:', error);
        throw error;
      }
      return (data || []) as Employee[];
    },
    enabled: !!user?.id,
  });
};

// Legacy compat alias
export const useEmployees = () => {
  const result = useLandlordEmployees();
  return { data: result.data, isLoading: result.isLoading, error: result.error };
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
      queryClient.invalidateQueries({ queryKey: ['units', data.property_id] });
    },
  });
};

export const useDeleteUnit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ unitId, propertyId }: { unitId: string; propertyId: string }) => {
      const { error } = await supabase
        .from('units')
        .delete()
        .eq('id', unitId);

      if (error) throw error;
      return { propertyId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['property-units', data.propertyId] });
      queryClient.invalidateQueries({ queryKey: ['property', data.propertyId] });
      queryClient.invalidateQueries({ queryKey: ['units', data.propertyId] });
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
      console.log('Updating maintenance request:', { id, updates });
      
      const { data, error } = await supabase
        .from('maintenance_requests')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating maintenance request:', { code: error.code, message: error.message, details: error.details });
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      // Invalidate all maintenance request queries
      queryClient.invalidateQueries({ queryKey: ['maintenanceRequests'] });
      queryClient.invalidateQueries({ queryKey: ['tenant-maintenance-requests'] });
      queryClient.invalidateQueries({ queryKey: ['property-maintenance-requests'] });
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

// =============================================
// PROJECT MUTATIONS
// =============================================

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (project: {
      title: string;
      description?: string;
      property_id?: string | null;
      priority?: string;
      budget?: number | null;
      due_date?: string | null;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('projects')
        .insert({
          landlord_id: user.id,
          title: project.title,
          description: project.description || null,
          property_id: project.property_id || null,
          priority: project.priority || 'medium',
          budget: project.budget || null,
          due_date: project.due_date || null,
          status: 'pending',
          progress: 0,
        })
        .select()
        .single();

      if (error) {
        console.error('[useCreateProject] Error:', error);
        throw error;
      }
      return data as Project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landlord-projects'] });
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Pick<Project, 'title' | 'description' | 'status' | 'priority' | 'budget' | 'progress' | 'due_date' | 'started_at' | 'completed_at'>>) => {
      // Auto-set timestamps
      const payload: any = { ...updates, updated_at: new Date().toISOString() };
      if (updates.status === 'in_progress' && !updates.started_at) {
        payload.started_at = new Date().toISOString();
      }
      if (updates.status === 'completed' && !updates.completed_at) {
        payload.completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('projects')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[useUpdateProject] Error:', error);
        throw error;
      }
      return data as Project;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project', data.id] });
      queryClient.invalidateQueries({ queryKey: ['landlord-projects'] });
      queryClient.invalidateQueries({ queryKey: ['employee-projects'] });
    },
  });
};

export const useAddProjectUpdate = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (update: {
      project_id: string;
      note?: string | null;
      status_change?: string | null;
      progress_change?: number | null;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('project_updates')
        .insert({
          project_id: update.project_id,
          author_id: user.id,
          note: update.note || null,
          status_change: update.status_change || null,
          progress_change: update.progress_change || null,
        })
        .select()
        .single();

      if (error) {
        console.error('[useAddProjectUpdate] Error:', error);
        throw error;
      }
      return data as ProjectUpdate;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project-updates', data.project_id] });
      queryClient.invalidateQueries({ queryKey: ['project', data.project_id] });
    },
  });
};

export const useAssignEmployee = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ projectId, employeeId, role }: {
      projectId: string;
      employeeId: string;
      role?: string;
    }) => {
      const { data, error } = await supabase
        .from('project_assignments')
        .insert({
          project_id: projectId,
          employee_id: employeeId,
          role: role || 'assignee',
        })
        .select()
        .single();

      if (error) {
        console.error('[useAssignEmployee] Error:', error);
        throw error;
      }
      // Best-effort: create a project thread when an employee with a user account is assigned
      try {
        if (user?.id) {
          const { data: employee } = await supabase
            .from('employees')
            .select('user_id, full_name')
            .eq('id', employeeId)
            .single();

          if (employee?.user_id) {
            const { data: project } = await supabase
              .from('projects')
              .select('title, landlord_id')
              .eq('id', projectId)
              .single();

            if (project?.landlord_id) {
              const { data: existingThreads } = await supabase
                .from('message_threads')
                .select('id')
                .eq('project_id', projectId);

              let hasThread = false;
              if (existingThreads && existingThreads.length > 0) {
                const threadIds = existingThreads.map((t: any) => t.id);
                const { data: participants } = await supabase
                  .from('thread_participants')
                  .select('thread_id, user_id')
                  .in('thread_id', threadIds);

                if (participants) {
                  const participantMap = new Map<string, Set<string>>();
                  participants.forEach((p: any) => {
                    if (!participantMap.has(p.thread_id)) {
                      participantMap.set(p.thread_id, new Set());
                    }
                    participantMap.get(p.thread_id)!.add(p.user_id);
                  });

                  hasThread = threadIds.some((id: string) => {
                    const set = participantMap.get(id);
                    return !!set && set.has(project.landlord_id) && set.has(employee.user_id);
                  });
                }
              }

              if (!hasThread) {
                const { data: thread, error: threadError } = await supabase
                  .from('message_threads')
                  .insert({
                    subject: `Project: ${project.title}`,
                    project_id: projectId,
                  })
                  .select()
                  .single();

                if (!threadError && thread) {
                  const participantInserts = [
                    { thread_id: thread.id, user_id: project.landlord_id, role: 'owner' },
                    { thread_id: thread.id, user_id: employee.user_id, role: 'member' },
                  ];

                  await supabase
                    .from('thread_participants')
                    .insert(participantInserts);

                  const messageBody = `Assignment created: ${employee.full_name || 'Employee'} joined ${project.title}.`;
                  await supabase
                    .from('thread_messages')
                    .insert({
                      thread_id: thread.id,
                      sender_id: user.id,
                      body: messageBody,
                    });

                  await supabase
                    .from('message_threads')
                    .update({ last_message_at: new Date().toISOString() })
                    .eq('id', thread.id);
                }
              }
            }
          }
        }
      } catch (threadError) {
        console.warn('[useAssignEmployee] Thread creation skipped:', threadError);
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project', data.project_id] });
      queryClient.invalidateQueries({ queryKey: ['landlord-projects'] });
      queryClient.invalidateQueries({ queryKey: ['employee-projects'] });
      queryClient.invalidateQueries({ queryKey: ['threads'] });
    },
  });
};

export const useRemoveAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ assignmentId, projectId }: { assignmentId: string; projectId: string }) => {
      const { error } = await supabase
        .from('project_assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;
      return { projectId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project', data.projectId] });
      queryClient.invalidateQueries({ queryKey: ['landlord-projects'] });
      queryClient.invalidateQueries({ queryKey: ['employee-projects'] });
    },
  });
};

// =============================================
// EMPLOYEE MUTATIONS
// =============================================

export const useAddEmployee = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (employee: { full_name: string; email?: string; phone?: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      // For now, create employee without linking to an auth user
      // The employee can later be linked when they sign up
      const { data, error } = await supabase
        .from('employees')
        .insert({
          user_id: user.id, // temp: use landlord's own id - will be updated when employee registers
          landlord_id: user.id,
          full_name: employee.full_name,
          email: employee.email || null,
          phone: employee.phone || null,
          status: 'invited',
        })
        .select()
        .single();

      if (error) {
        console.error('[useAddEmployee] Error:', error);
        throw error;
      }
      return data as Employee;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landlord-employees'] });
    },
  });
};

// =============================================
// THREAD MESSAGING HOOKS
// =============================================

// Get all threads for the current user
export const useThreads = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['threads', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get thread IDs from participants
      const { data: participantData, error: partError } = await supabase
        .from('thread_participants')
        .select('thread_id')
        .eq('user_id', user.id);

      if (partError) throw partError;
      if (!participantData || participantData.length === 0) return [];

      const threadIds = participantData.map((p: any) => p.thread_id);

      // Get threads with last message
      const { data: threads, error } = await supabase
        .from('message_threads')
        .select('*')
        .in('id', threadIds)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      // Get latest message for each thread
      const threadsWithLastMessage = await Promise.all(
        (threads || []).map(async (thread: any) => {
          const { data: msgs } = await supabase
            .from('thread_messages')
            .select('*')
            .eq('thread_id', thread.id)
            .order('created_at', { ascending: false })
            .limit(1);

          // Get other participant names
          const { data: parts } = await supabase
            .from('thread_participants')
            .select('user_id, role')
            .eq('thread_id', thread.id);

          return {
            ...thread,
            lastMessage: msgs?.[0] || null,
            participants: parts || [],
          } as MessageThread;
        })
      );

      return threadsWithLastMessage;
    },
    enabled: !!user?.id,
  });
};

// Get messages for a specific thread
export const useThreadMessages = (threadId: string | null | undefined) => {
  return useQuery({
    queryKey: ['thread-messages', threadId],
    queryFn: async () => {
      if (!threadId) return [];

      const { data, error } = await supabase
        .from('thread_messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []) as ThreadMessage[];
    },
    enabled: !!threadId,
    refetchInterval: 5000, // Poll for new messages every 5s
  });
};

// Send message in a thread
export const useSendThreadMessage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ threadId, body }: { threadId: string; body: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('thread_messages')
        .insert({
          thread_id: threadId,
          sender_id: user.id,
          body,
        })
        .select()
        .single();

      if (error) throw error;

      // Update thread's last_message_at
      await supabase
        .from('message_threads')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', threadId);

      return data as ThreadMessage;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['thread-messages', data.thread_id] });
      queryClient.invalidateQueries({ queryKey: ['threads'] });
    },
  });
};

// Create a new thread
export const useCreateThread = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ subject, participantIds, propertyId, projectId, initialMessage }: {
      subject?: string;
      participantIds: string[];
      propertyId?: string | null;
      projectId?: string | null;
      initialMessage?: string;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Create the thread
      const { data: thread, error: threadError } = await supabase
        .from('message_threads')
        .insert({
          subject: subject || null,
          property_id: propertyId || null,
          project_id: projectId || null,
        })
        .select()
        .single();

      if (threadError) throw threadError;

      // Add all participants (including creator)
      const allParticipants = [user.id, ...participantIds.filter(id => id !== user.id)];
      const participantInserts = allParticipants.map((uid, i) => ({
        thread_id: thread.id,
        user_id: uid,
        role: i === 0 ? 'owner' : 'member',
      }));

      const { error: partError } = await supabase
        .from('thread_participants')
        .insert(participantInserts);

      if (partError) throw partError;

      // Send initial message if provided
      if (initialMessage) {
        await supabase
          .from('thread_messages')
          .insert({
            thread_id: thread.id,
            sender_id: user.id,
            body: initialMessage,
          });

        await supabase
          .from('message_threads')
          .update({ last_message_at: new Date().toISOString() })
          .eq('id', thread.id);
      }

      return thread as MessageThread;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['threads'] });
    },
  });
};
