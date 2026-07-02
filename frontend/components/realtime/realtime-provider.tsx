'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { getAccessToken, WS_BASE } from '@/lib/api/client';
import type { RealtimeEvent } from '@/lib/api/types';
import { formatNaira } from '@/lib/utils';
import { queryKeys } from '@/hooks/use-api';

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (loading || !user) return;

    let closedByEffect = false;

    const invalidateCampaign = (goalId?: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.virtualAccounts });
      queryClient.invalidateQueries({ queryKey: queryKeys.notificationsUnread });
      if (goalId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.goal(goalId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.goalVa(goalId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.goalTxns(goalId) });
      }
    };

    const connect = () => {
      const token = getAccessToken();
      if (!token) return;

      const url = `${WS_BASE}?token=${encodeURIComponent(token)}`;
      const socket = new WebSocket(url);
      socketRef.current = socket;

      socket.onmessage = (message) => {
        let event: RealtimeEvent;
        try {
          event = JSON.parse(message.data) as RealtimeEvent;
        } catch {
          return;
        }

        if (event.type === 'connected') return;

        const goalId = event.goal_id ?? (event.data.goal_id as string | undefined);

        if (event.type === 'transaction.created') {
          invalidateCampaign(goalId);
          queryClient.invalidateQueries({ queryKey: ['transactions'] });
          queryClient.invalidateQueries({ queryKey: queryKeys.adminOverview });
          const amount = Number(event.data.amount ?? 0);
          toast.success(amount ? `New payment received: ${formatNaira(amount)}` : 'New payment received');
        }

        if (event.type === 'campaign.balance_updated') {
          invalidateCampaign(goalId);
        }

        if (event.type === 'campaign.completed') {
          invalidateCampaign(goalId);
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          toast.success('Campaign target reached. Collection account is now inactive.');
        }

        if (event.type === 'webhook.failed') {
          queryClient.invalidateQueries({ queryKey: queryKeys.adminOverview });
          queryClient.invalidateQueries({ queryKey: ['admin-webhooks'] });
          if (user.role === 'admin') toast.error('Webhook processing failed. Check admin webhook health.');
        }
      };

      socket.onclose = () => {
        socketRef.current = null;
        if (!closedByEffect) retryRef.current = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      closedByEffect = true;
      if (retryRef.current) clearTimeout(retryRef.current);
      socketRef.current?.close();
    };
  }, [loading, queryClient, user]);

  return <>{children}</>;
}
