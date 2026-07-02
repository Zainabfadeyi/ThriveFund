import http from 'http';
import jwt from 'jsonwebtoken';
import WebSocket, { WebSocketServer } from 'ws';
import { env } from '../config/env';
import type { JwtPayload } from '../middleware/auth.middleware';

type RealtimeClient = {
  socket: WebSocket;
  user: JwtPayload;
};

type RealtimeEvent = {
  type: 'campaign.balance_updated' | 'campaign.completed' | 'transaction.created' | 'webhook.failed';
  user_id?: string;
  organization_id?: string | null;
  goal_id?: string;
  data: Record<string, unknown>;
};

const clients = new Set<RealtimeClient>();

export function attachRealtime(server: http.Server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (socket, request) => {
    const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);
    const token = url.searchParams.get('token');
    if (!token) {
      socket.close(1008, 'Missing token');
      return;
    }

    try {
      const user = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
      const client = { socket, user };
      clients.add(client);
      socket.send(JSON.stringify({ type: 'connected', data: { user_id: user.sub } }));
      socket.on('close', () => clients.delete(client));
      socket.on('error', () => clients.delete(client));
    } catch {
      socket.close(1008, 'Invalid token');
    }
  });

  return wss;
}

export function broadcastRealtime(event: RealtimeEvent) {
  const payload = JSON.stringify(event);
  for (const client of clients) {
    const shouldSend =
      client.user.role === 'admin' ||
      (event.user_id && client.user.sub === event.user_id);

    if (shouldSend && client.socket.readyState === WebSocket.OPEN) {
      client.socket.send(payload);
    }
  }
}
