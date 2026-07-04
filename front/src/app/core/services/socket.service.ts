import { Injectable, OnDestroy, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class SocketService implements OnDestroy {
  private socket: Socket | null = null;

  // ── Observables ───────────────────────────────────────────
  message$        = new Subject<any>();
  notification$   = new Subject<any>();
  typing$         = new Subject<any>();
  stopTyping$     = new Subject<any>();
  bookingUpdate$  = new Subject<any>();
  projectUpdate$  = new Subject<any>();
  fileUploaded$   = new Subject<any>();
  userOnline$     = new Subject<{ userId: string }>();
  userOffline$    = new Subject<{ userId: string }>();
  messageRead$    = new Subject<{ threadId: string; readBy: string }>();
  messageDelivered$ = new Subject<{ messageId: string; threadId: string }>();

  // Track online users locally
  onlineUsers = signal<Set<string>>(new Set());

  constructor(private authService: AuthService) {}

  connect() {
    const token = this.authService.getAccessToken();
    if (!token || this.socket?.connected) return;

    this.socket = io(environment.socketUrl, {
      auth: { token },
      transports: ['websocket'],
    });

    this.socket.on('connect',    () => console.log('✅ Socket connected'));
    this.socket.on('disconnect', () => console.log('⚠️ Socket disconnected'));
    this.socket.on('connect_error', (err: any) => console.error('Socket error:', err.message));

    this.socket.on('message:receive',    (d: any) => this.message$.next(d));
    this.socket.on('notification:new',   (d: any) => this.notification$.next(d));
    this.socket.on('message:typing',     (d: any) => this.typing$.next(d));
    this.socket.on('message:stop-typing',(d: any) => this.stopTyping$.next(d));
    this.socket.on('message:read',       (d: any) => this.messageRead$.next(d));
    this.socket.on('message:delivered',  (d: any) => this.messageDelivered$.next(d));
    this.socket.on('booking:status-changed', (d: any) => this.bookingUpdate$.next(d));
    this.socket.on('project:updated',    (d: any) => this.projectUpdate$.next(d));
    this.socket.on('file:uploaded',      (d: any) => this.fileUploaded$.next(d));

    this.socket.on('user:online',  (d: { userId: string }) => {
      this.userOnline$.next(d);
      this.onlineUsers.update(s => { const n = new Set(s); n.add(d.userId); return n; });
    });
    this.socket.on('user:offline', (d: { userId: string }) => {
      this.userOffline$.next(d);
      this.onlineUsers.update(s => { const n = new Set(s); n.delete(d.userId); return n; });
    });
  }

  disconnect() { this.socket?.disconnect(); this.socket = null; }

  isOnline(userId: string) { return this.onlineUsers().has(userId); }

  sendMessage(toUserId: string, content: string) {
    this.socket?.emit('message:send', { toUserId, content });
  }
  sendTyping(toUserId: string) {
    this.socket?.emit('message:typing', { toUserId });
  }
  sendStopTyping(toUserId: string) {
    this.socket?.emit('message:stop-typing', { toUserId });
  }
  sendRead(threadId: string, toUserId: string) {
    this.socket?.emit('message:read', { threadId, toUserId });
  }
  joinRoom(roomId: string)  { this.socket?.emit('room:join', roomId); }
  leaveRoom(roomId: string) { this.socket?.emit('room:leave', roomId); }

  ngOnDestroy() { this.disconnect(); }
}
