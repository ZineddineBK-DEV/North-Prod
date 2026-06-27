import { Component, inject, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { DashboardShellComponent, NavItem } from '../../../shared/components/dashboard-shell/dashboard-shell';
import { AuthService } from '../../../core/services/auth.service';
import { SocketService } from '../../../core/services/socket.service';
import { environment } from '../../../../environments/environment';

const NAV: NavItem[] = [
  { label:'Tableau de bord', icon:'fa fa-tachometer', route:'/artist/dashboard' },
  { label:'Réservations',    icon:'fa fa-calendar',   route:'/artist/bookings'  },
  { label:'Mes Projets',     icon:'fa fa-music',      route:'/artist/projects'  },
  { label:'Messages',        icon:'fa fa-comments',   route:'/artist/messages'  },
  { label:'Mon Profil',      icon:'fa fa-user',       route:'/artist/profile'   },
];

@Component({
  selector: 'app-artist-messages',
  templateUrl: './messages.html',
  styleUrls: ['./messages.scss'],
  imports: [DashboardShellComponent, ReactiveFormsModule],
})
export class ArtistMessagesComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesEnd') messagesEnd!: ElementRef;

  authService  = inject(AuthService);
  socketSvc    = inject(SocketService);
  private http = inject(HttpClient);
  private fb   = inject(FormBuilder);
  private api  = environment.apiUrl;

  navItems  = NAV;
  threads: any[]  = [];
  messages: any[]  = [];
  activeThread: any = null;
  loadingThreads = true;
  loadingMessages = false;
  typingTimeout: any;
  isOtherTyping = false;
  private subs: Subscription[] = [];
  private shouldScroll = false;

  form = this.fb.group({ content: [''] });

  ngOnInit() {
    this.socketSvc.connect();
    this.loadThreads();
    this.subs.push(
      this.socketSvc.message$.subscribe(data => {
        if (this.activeThread && data.message?.thread === this.activeThread._id) {
          this.messages.push(data.message);
          this.shouldScroll = true;
        }
      }),
      this.socketSvc.typing$.subscribe(d => {
        if (this.activeThread) { this.isOtherTyping = true; }
      }),
      this.socketSvc.stopTyping$.subscribe(() => { this.isOtherTyping = false; }),
    );
  }

  ngAfterViewChecked() {
    if (this.shouldScroll) { this.scrollToBottom(); this.shouldScroll = false; }
  }

  loadThreads() {
    this.loadingThreads = true;
    this.http.get<any>(`${this.api}/messages/threads`).subscribe({
      next: res => { this.threads = res.threads; this.loadingThreads = false; },
      error: () => this.loadingThreads = false,
    });
  }

  openThread(thread: any) {
    this.activeThread = thread;
    this.loadingMessages = true;
    const otherId = thread.participants.find((p: any) => p._id !== this.authService.currentUser()?._id)?._id;
    if (!otherId) return;
    this.http.get<any>(`${this.api}/messages/thread/${otherId}/messages`).subscribe({
      next: res => { this.messages = res.messages; this.loadingMessages = false; this.shouldScroll = true; },
      error: () => this.loadingMessages = false,
    });
  }

  send() {
    const content = this.form.value.content?.trim();
    if (!content || !this.activeThread) return;
    const otherId = this.activeThread.participants.find((p: any) => p._id !== this.authService.currentUser()?._id)?._id;
    this.http.post<any>(`${this.api}/messages`, { toUserId: otherId, content }).subscribe({
      next: res => { this.messages.push(res.message); this.form.reset(); this.shouldScroll = true; },
    });
    this.socketSvc.sendStopTyping(otherId);
  }

  onTyping() {
    const otherId = this.activeThread?.participants.find((p: any) => p._id !== this.authService.currentUser()?._id)?._id;
    if (!otherId) return;
    this.socketSvc.sendTyping(otherId);
    clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => this.socketSvc.sendStopTyping(otherId), 2000);
  }

  scrollToBottom() {
    try { this.messagesEnd?.nativeElement.scrollIntoView({ behavior: 'smooth' }); } catch {}
  }

  isMine(msg: any) { return msg.sender?._id === this.authService.currentUser()?._id || msg.sender === this.authService.currentUser()?._id; }
  otherUser(thread: any) { return thread.participants.find((p: any) => p._id !== this.authService.currentUser()?._id); }
  formatTime(d: string) { return new Date(d).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' }); }
  formatDay(d: string) { return new Date(d).toLocaleDateString('fr-FR', { day:'numeric', month:'short' }); }

  ngOnDestroy() { this.subs.forEach(s => s.unsubscribe()); }
}
