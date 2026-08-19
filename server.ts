import express from 'express';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { WebSocketServer } from 'ws';
import { app, chatMessages, saveServerStore, isUserMuted } from './api/index.js';

async function startServer() {
  const PORT = 3000;

  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        const indexPath = path.join(distPath, 'index.html');
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          res.status(404).send('Index file not found');
        }
      });
    }
  }

  if (process.env.VERCEL !== '1') {
    const httpServer = http.createServer(app);
    const wss = new WebSocketServer({ server: httpServer });

    wss.on('connection', (ws, req) => {
      console.log('[WebSocket] Client connected to Global Chat');
      
      const forwarded = req.headers['x-forwarded-for'];
      const clientIp = typeof forwarded === 'string'
        ? forwarded.split(',')[0].trim()
        : (req.socket.remoteAddress || '');

      // Send historical messages on initial connection
      ws.send(JSON.stringify({ type: 'history', data: chatMessages }));

      ws.on('message', async (data) => {
        try {
          const payload = JSON.parse(data.toString());
          if (payload.type === 'message') {
            const { username, text, replyTo } = payload;
            if (typeof username === 'string' && typeof text === 'string' && text.trim()) {
              const cleanUser = username.trim();

              // Check if user or IP is muted
              const muteInfo = isUserMuted(cleanUser, clientIp);
              if (muteInfo.isMuted) {
                ws.send(JSON.stringify({
                  type: 'mute_alert',
                  message: muteInfo.isPermanent
                    ? 'Akun/IP Anda sedang dimute secara PERMANEN oleh Admin.'
                    : 'Akun/IP Anda sedang dimute oleh Admin.',
                  isMuted: true,
                  isPermanent: Boolean(muteInfo.isPermanent),
                  mutedUntil: muteInfo.mutedUntil,
                  remainingMs: muteInfo.remainingMs,
                  durationLabel: muteInfo.durationLabel,
                  reason: muteInfo.reason,
                  target: muteInfo.target,
                  targetType: muteInfo.targetType
                }));
                return;
              }

              const newMessage = {
                id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
                username: cleanUser,
                text: text.trim(),
                timestamp: new Date().toISOString(),
                replyTo: replyTo && typeof replyTo === 'object' ? {
                  id: String(replyTo.id || ''),
                  username: String(replyTo.username || ''),
                  text: String(replyTo.text || '')
                } : null
              };

              chatMessages.push(newMessage);
              
              // Caps at 50 messages
              while (chatMessages.length > 50) {
                chatMessages.shift();
              }

              // Persist messages to MongoDB/LocalStore
              await saveServerStore().catch((err) => {
                console.error('[WebSocket] Error saving chat store:', err);
              });

              // Broadcast
              const broadcastPayload = JSON.stringify({ type: 'message', data: newMessage });
              wss.clients.forEach((client) => {
                if (client.readyState === 1) { // 1 is WebSocket.OPEN
                  client.send(broadcastPayload);
                }
              });
            }
          } else if (payload.type === 'delete') {
            const { messageId, username, deleteType } = payload;
            if (messageId && username && deleteType === 'everyone') {
              const msgIndex = chatMessages.findIndex((m) => m.id === messageId);
              if (msgIndex !== -1) {
                const targetMsg = chatMessages[msgIndex];
                const isAdmin = username.toLowerCase() === 'nabil' || username.toLowerCase() === 'admin';
                const isOwner = targetMsg.username.toLowerCase() === username.toLowerCase();

                if (isOwner || isAdmin) {
                  chatMessages.splice(msgIndex, 1);
                  await saveServerStore().catch((err) => {
                    console.error('[WebSocket] Error saving store after delete:', err);
                  });

                  const broadcastPayload = JSON.stringify({ type: 'delete_everyone', data: { id: messageId } });
                  wss.clients.forEach((client) => {
                    if (client.readyState === 1) {
                      client.send(broadcastPayload);
                    }
                  });
                }
              }
            }
          }
        } catch (err) {
          console.error('[WebSocket] Message parsing/broadcast failed:', err);
        }
      });

      ws.on('close', () => {
        console.log('[WebSocket] Client disconnected from Global Chat');
      });
    });

    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`[AlightPro Server] Running with WebSockets on http://localhost:${PORT}`);
    });
  }
}

startServer().catch((err) => {
  console.error('[Server Startup Error]', err);
});

export { app };
export default app;
