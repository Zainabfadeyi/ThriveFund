'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { getAccessToken, refreshAccessToken, WS_BASE } from '@/lib/api/client';
import type { RealtimeEvent } from '@/lib/api/types';
import { formatNaira } from '@/lib/utils';
import { invalidateCampaignQueries, patchGoalBalanceInCache } from '@/lib/realtime-cache';

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const paymentToastRef = useRef<{ count: number; total: number; timer: ReturnType<typeof setTimeout> | null }>({
    count: 0,
    total: 0,
    timer: null,
  });

  useEffect(() => {
    if (loading || !user) return;

    let closedByEffect = false;

    const handleEvent = (event: RealtimeEvent) => {
      if (event.type === 'connected') return;

      const goalId = event.goal_id ?? (event.data.goal_id as string | undefined);
      const balancePayload = {
        current_amount: event.data.current_amount as number | undefined,
        target_amount: event.data.target_amount as number | undefined,
        status: event.data.status as string | undefined,
        slug: (event.data.slug as string | null | undefined) ?? undefined,
      };

      if (goalId && balancePayload.current_amount !== undefined) {
        patchGoalBalanceInCache(queryClient, goalId, balancePayload);
      }

      if (
        event.type === 'transaction.created' ||
        event.type === 'campaign.balance_updated' ||
        event.type === 'campaign.completed'
      ) {
        invalidateCampaignQueries(queryClient, goalId, balancePayload.slug ?? undefined);
      }

      if (event.type === 'transaction.created') {
        const amount = Number(event.data.amount ?? 0);
        const bucket = paymentToastRef.current;
        bucket.count += 1;
        bucket.total += amount;
        if (bucket.timer) clearTimeout(bucket.timer);
        bucket.timer = setTimeout(() => {
          const { count, total } = paymentToastRef.current;
          paymentToastRef.current = { count: 0, total: 0, timer: null };
          if (count <= 1) {
            toast.success(total ? `New payment received: ${formatNaira(total)}` : 'New payment received');
          } else {
            toast.success(`${count} new payments received · ${formatNaira(total)} total`);
          }
        }, 1200);
      }

      if (event.type === 'campaign.completed') {
        void queryClient.invalidateQueries({ queryKey: ['notifications'], refetchType: 'active' });
        toast.success('Campaign target reached. Withdraw funds when you are ready.');
      }

      if (event.type === 'webhook.failed' && user.role === 'admin') {
        void queryClient.invalidateQueries({ queryKey: ['admin-overview'], refetchType: 'active' });
        void queryClient.invalidateQueries({ queryKey: ['admin-webhooks'], refetchType: 'active' });
        toast.error('Webhook processing failed. Check admin webhook health.');
      }
    };

    const connect = async () => {
      let token = getAccessToken();
      if (!token) {
        token = await refreshAccessToken();
      }
      if (!token) return;

      const url = `${WS_BASE}?token=${encodeURIComponent(token)}`;
      const socket = new WebSocket(url);
      socketRef.current = socket;

      socket.onmessage = (message) => {
        try {
          handleEvent(JSON.parse(message.data) as RealtimeEvent);
        } catch {
          // ignore malformed payloads
        }
      };

      socket.onclose = async (closeEvent) => {
        socketRef.current = null;
        if (closedByEffect) return;

        if (closeEvent.code === 1008) {
          await refreshAccessToken();
        }

        retryRef.current = setTimeout(() => {
          void connect();
        }, 3000);
      };
    };

    void connect();

    return () => {
      closedByEffect = true;
      if (retryRef.current) clearTimeout(retryRef.current);
      if (paymentToastRef.current.timer) clearTimeout(paymentToastRef.current.timer);
      socketRef.current?.close();
    };
  }, [loading, queryClient, user]);

  return <>{children}</>;
}
