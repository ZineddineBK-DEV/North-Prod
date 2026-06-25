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

  constructor(private authService: AuthService) {}

  connect() {
    const token = this.authService.getAccessToken();
    if (!token || this.socket?.connected) return;

    this.socket = io(environment.socketUrl, {
      auth: { token },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => console.log('Socket connected'));
    this.socket.on('disconnect', () => console.log('Socket disconnected'));

    this.socket.on('message:receive',         (data) => this.message$.next(data));
    this.socket.on('notification:new',        (data) => this.notification$.next(data));
    this.socket.on('message:typing',          (data) => this.typing$.next(data));
    this.socket.on('message:stop-typing',     (data) => this.stopTyping$.next(data));
    this.socket.on('booking:status-changed',  (data) => this.bookingUpdate$.next(data));
    this.socket.on('project:updated',         (data) => this.projectUpdate$.next(data));
    this.socket.on('file:uploaded',           (data) => this.fileUploaded$.next(data));
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  sendMessage(toUserId: string, content: string) {
    this.socket?.emit('message:send', { toUserId, content });
  }

  sendTyping(toUserId: string) {
    this.socket?.emit('message:typing', { toUserId });
  }

  sendStopTyping(toUserId: string) {
    this.socket?.emit('message:stop-typing', { toUserId });
  }

  joinRoom(roomId: string) {
    this.socket?.emit('room:join', roomId);
  }

  leaveRoom(roomId: string) {
    this.socket?.emit('room:leave', roomId);
  }

  ngOnDestroy() { this.disconnect(); }
}
