import { useEffect, useState, useContext, createContext, ReactNode } from 'react';
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
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    if (!error && data) {
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
      const roleInserts = selectedRoles.map(role => ({
        user_id: data.user!.id,
        role: role
      }));

      const { error: roleError } = await supabase
        .from('user_roles')
        .insert(roleInserts);

      if (roleError) {
        console.error('Error setting user roles:', roleError);
        return { error: roleError };
      }

      setRoles(selectedRoles);
      setActiveRole(selectedRoles[0]);
      AsyncStorage.setItem(ACTIVE_ROLE_KEY, selectedRoles[0]);
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

    const { error } = await supabase
      .from('user_roles')
      .insert({ user_id: user.id, role });

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
