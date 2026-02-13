import { useEffect, useState, useContext, createContext, ReactNode, useRef } from 'react';
import { Alert } from 'react-native';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserRole = 'tenant' | 'landlord' | 'employee' | 'builder' | 'specialist' | 'admin';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  roles: UserRole[];
  activeRole: UserRole | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, selectedRoles: UserRole[]) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  switchRole: (role: UserRole) => void;
  addRole: (role: UserRole) => Promise<{ error: Error | null }>;
  removeRole: (role: UserRole) => Promise<{ error: Error | null }>;
  refreshRoles: () => Promise<void>;
}

const ACTIVE_ROLE_KEY = 'naya_active_role';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [activeRole, setActiveRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const roleTableAvailableRef = useRef(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Defer role fetch to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchUserRoles(session.user.id);
          }, 0);
        } else {
          setRoles([]);
          setActiveRole(null);
          AsyncStorage.removeItem(ACTIVE_ROLE_KEY);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchUserRoles(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRoles = async (userId: string) => {
    if (!roleTableAvailableRef.current) return;
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    if (error) {
      const errorCode = (error as { code?: string }).code;
      // Handle missing table/endpoint (404 or PGRST204/PGRST205)
      if (errorCode === 'PGRST204' || errorCode === 'PGRST205' || (error.message && error.message.includes('404'))) {
        console.warn('user_roles table not found. Please run migrations:', error);
        roleTableAvailableRef.current = false;
        // Don't block UI, just log warning
        return;
      }
      // For other errors, log and alert
      console.error('Failed to load user roles:', error);
      Alert.alert(
        'Unable to Load Roles',
        'There was a problem loading your roles. You can continue using the app, but some features may be limited.\n\nError: ' + (error.message || 'Unknown error')
      );
      return;
    }

    if (data) {
      const userRoles = data.map(r => r.role as UserRole);
      setRoles(userRoles);

      // Restore active role from AsyncStorage or pick first role
      const savedRole = await AsyncStorage.getItem(ACTIVE_ROLE_KEY);
      if (savedRole && userRoles.includes(savedRole as UserRole)) {
        setActiveRole(savedRole as UserRole);
      } else if (userRoles.length > 0) {
        setActiveRole(userRoles[0]);
        AsyncStorage.setItem(ACTIVE_ROLE_KEY, userRoles[0]);
      }
    }
  };

  const refreshRoles = async () => {
    if (user) {
      await fetchUserRoles(user.id);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string = '',
    selectedRoles: UserRole[] = []
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      return { error };
    }

    // Insert all selected roles after successful signup
    if (data.user && Array.isArray(selectedRoles) && selectedRoles.length > 0) {
      if (!roleTableAvailableRef.current) {
        setRoles(selectedRoles);
        setActiveRole(selectedRoles[0]);
        AsyncStorage.setItem(ACTIVE_ROLE_KEY, selectedRoles[0]);
        return { error: null };
      }
      const roleInserts = selectedRoles.map(role => ({
        user_id: data.user!.id,
        role: role
      }));

      const { error: roleError } = await supabase
        .from('user_roles')
        .insert(roleInserts);

      if (roleError) {
        const errorCode = (roleError as { code?: string }).code;
        // Handle missing table gracefully
        if (errorCode === 'PGRST204' || errorCode === 'PGRST205' || (roleError.message && roleError.message.includes('404'))) {
          console.warn('user_roles table not found, storing roles locally only');
          roleTableAvailableRef.current = false;
          setRoles(selectedRoles);
          setActiveRole(selectedRoles[0]);
          AsyncStorage.setItem(ACTIVE_ROLE_KEY, selectedRoles[0]);
          return { error: null };
        }
        // For real errors, show detailed message
        console.error('Error setting user roles:', roleError);
        Alert.alert(
          'Role Setup Error',
          'Unable to save your role to the database.\n\nError: ' + (roleError.message || 'Unknown error') +
          '\n\nPlease contact support if this continues.'
        );
        return { error: roleError };
      } else {
        setRoles(selectedRoles);
        setActiveRole(selectedRoles[0]);
        AsyncStorage.setItem(ACTIVE_ROLE_KEY, selectedRoles[0]);
      }
    }

    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRoles([]);
    setActiveRole(null);
    AsyncStorage.removeItem(ACTIVE_ROLE_KEY);
  };

  const switchRole = (role: UserRole) => {
    if (roles.includes(role)) {
      setActiveRole(role);
      AsyncStorage.setItem(ACTIVE_ROLE_KEY, role);
    }
  };

  const addRole = async (role: UserRole) => {
    if (!user) return { error: new Error('Not authenticated') };
    if (roles.includes(role)) return { error: null };
    if (role === 'admin') return { error: new Error('Cannot self-assign admin role') };

    if (!roleTableAvailableRef.current) {
      const newRoles = [...roles, role];
      setRoles(newRoles);
      if (!activeRole) {
        setActiveRole(role);
        AsyncStorage.setItem(ACTIVE_ROLE_KEY, role);
      }
      return { error: null };
    }

    const { error } = await supabase
      .from('user_roles')
      .insert({ user_id: user.id, role });

    if (error) {
      const errorCode = (error as { code?: string }).code;
      if (errorCode === 'PGRST204' || errorCode === 'PGRST205' || (error.message && error.message.includes('404'))) {
        roleTableAvailableRef.current = false;
        const newRoles = [...roles, role];
        setRoles(newRoles);
        if (!activeRole) {
          setActiveRole(role);
          AsyncStorage.setItem(ACTIVE_ROLE_KEY, role);
        }
        return { error: null };
      }
      console.error('Error adding role:', error);
      Alert.alert(
        'Unable to Add Role',
        'There was a problem adding this role.\n\nError: ' + (error.message || 'Unknown error')
      );
      return { error };
    }

    if (!error) {
      const newRoles = [...roles, role];
      setRoles(newRoles);
      if (!activeRole) {
        setActiveRole(role);
        AsyncStorage.setItem(ACTIVE_ROLE_KEY, role);
      }
    }

    return { error };
  };

  const removeRole = async (role: UserRole) => {
    if (!user) return { error: new Error('Not authenticated') };
    if (!roles.includes(role)) return { error: null };
    if (roles.length === 1) return { error: new Error('Cannot remove last role') };
    if (role === 'admin') return { error: new Error('Cannot remove admin role') };

    if (!roleTableAvailableRef.current) {
      const newRoles = roles.filter(r => r !== role);
      setRoles(newRoles);
      if (activeRole === role) {
        setActiveRole(newRoles[0] || null);
        if (newRoles[0]) {
          AsyncStorage.setItem(ACTIVE_ROLE_KEY, newRoles[0]);
        }
      }
      return { error: null };
    }

    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', user.id)
      .eq('role', role);

    if (!error) {
      const newRoles = roles.filter(r => r !== role);
      setRoles(newRoles);
      if (activeRole === role) {
        setActiveRole(newRoles[0]);
        AsyncStorage.setItem(ACTIVE_ROLE_KEY, newRoles[0]);
      }
    }

    return { error };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        roles,
        activeRole,
        loading,
        signUp,
        signIn,
        signOut,
        switchRole,
        addRole,
        removeRole,
        refreshRoles,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  // For backward compatibility, also expose role as alias for activeRole
  return { ...context, role: context.activeRole };
};
