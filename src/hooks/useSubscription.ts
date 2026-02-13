import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';
import { useAuth } from './useAuth';

export type SubscriptionPlan = 'free' | 'pro_monthly' | 'pro_yearly';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'pending';

interface Subscription {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  starts_at: string;
  expires_at: string | null;
  payment_method: string | null;
  payment_reference: string | null;
  amount: number | null;
  currency: string;
  created_at: string;
  updated_at: string;
}

interface SubscriptionDetails {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  expires_at: string | null;
  days_remaining: number | null;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: subscription, isLoading, error } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as Subscription | null;
    },
    enabled: !!user?.id,
  });

  const { data: subscriptionDetails } = useQuery({
    queryKey: ['subscription-details', user?.id],
    queryFn: async (): Promise<SubscriptionDetails | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .rpc('get_user_subscription', { _user_id: user.id });

      if (error) throw error;
      return data?.[0] as SubscriptionDetails | null ?? null;
    },
    enabled: !!user?.id,
  });

  const isPro = subscription?.status === 'active' &&
    (subscription?.plan === 'pro_monthly' || subscription?.plan === 'pro_yearly') &&
    (!subscription?.expires_at || new Date(subscription.expires_at) > new Date());

  const isExpiringSoon = subscriptionDetails?.days_remaining !== null &&
    subscriptionDetails?.days_remaining !== undefined &&
    subscriptionDetails.days_remaining <= 7 &&
    subscriptionDetails.days_remaining > 0;

  const createSubscription = useMutation({
    mutationFn: async (data: {
      plan: SubscriptionPlan;
      payment_method: string;
      payment_reference?: string;
      amount: number;
    }) => {
      const { error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user?.id,
          plan: data.plan,
          status: 'pending',
          payment_method: data.payment_method,
          payment_reference: data.payment_reference,
          amount: data.amount,
          currency: 'USD',
          starts_at: new Date().toISOString(),
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['subscription-details', user?.id] });
    },
  });

  return {
    subscription,
    subscriptionDetails,
    isLoading,
    error,
    isPro,
    isExpiringSoon,
    createSubscription,
  };
};
