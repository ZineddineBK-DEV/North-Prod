import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class SocketService implements OnDestroy {
  private socket: Socket | null = null;

  // ── Observable streams ────────────────────────────────────
  message$        = new Subject<any>();
  notification$   = new Subject<any>();
  typing$         = new Subject<any>();
  stopTyping$     = new Subject<any>();
  bookingUpdate$  = new Subject<any>();
  projectUpdate$  = new Subject<any>();
  fileUploaded$   = new Subject<any>();
  userOnline$     = new Subject<any>();
  userOffline$    = new Subject<any>();
  delivered$      = new Subject<any>();
  read$           = new Subject<any>();

  constructor(private authService: AuthService) {}

  connect() {
    const token = this.authService.getAccessToken();
    if (!token || this.socket?.connected) return;

    this.socket = io(environment.socketUrl, {
      auth: { token },
      transports: ['websocket'],
    });

    this.socket.on('connect',    () => console.log('Socket connected'));
    this.socket.on('disconnect', () => console.log('Socket disconnected'));

    this.socket.on('message:receive',        (data: any) => this.message$.next(data));
    this.socket.on('notification:new',       (data: any) => this.notification$.next(data));
    this.socket.on('message:typing',         (data: any) => this.typing$.next(data));
    this.socket.on('message:stop-typing',    (data: any) => this.stopTyping$.next(data));
    this.socket.on('booking:status-changed', (data: any) => this.bookingUpdate$.next(data));
    this.socket.on('project:updated',        (data: any) => this.projectUpdate$.next(data));
    this.socket.on('file:uploaded',          (data: any) => this.fileUploaded$.next(data));
    this.socket.on('user:online',            (data: any) => this.userOnline$.next(data));
    this.socket.on('user:offline',           (data: any) => this.userOffline$.next(data));
    this.socket.on('message:delivered',      (data: any) => this.delivered$.next(data));
    this.socket.on('message:read',           (data: any) => this.read$.next(data));
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  sendTyping(toUserId: string)     { this.socket?.emit('message:typing',      { toUserId }); }
  sendStopTyping(toUserId: string) { this.socket?.emit('message:stop-typing', { toUserId }); }
  sendDelivered(toUserId: string, messageId: string) {
    this.socket?.emit('message:delivered', { toUserId, messageId });
  }
  sendRead(toUserId: string, threadId: string) {
    this.socket?.emit('message:read', { toUserId, threadId });
  }
  joinRoom(roomId: string)  { this.socket?.emit('room:join',  roomId); }
  leaveRoom(roomId: string) { this.socket?.emit('room:leave', roomId); }

  ngOnDestroy() { this.disconnect(); }
}
