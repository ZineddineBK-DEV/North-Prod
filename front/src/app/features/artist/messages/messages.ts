import {
  Component, OnInit, OnDestroy, inject, ElementRef,
  ViewChild, AfterViewChecked, signal
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { SocketService } from '../../../core/services/socket.service';
import { environment } from '../../../../environments/environment';

interface ChatUser { _id: string; aka?: string; firstName?: string; avatar?: string; role?: string; }
interface Attachment { name: string; url: string; mimeType: string; size: number; }
interface ChatMessage {
  _id: string; thread: string; sender: ChatUser; receiver: string;
  content: string; attachment?: Attachment; isRead: boolean;
  isDelivered?: boolean; createdAt: string;
}
interface Thread {
  _id: string; participants: ChatUser[]; lastMessage?: any;
  lastMessageAt?: string; unreadCounts?: { user: string; count: number }[];
}

@Component({
  selector: 'app-artist-messages',
  templateUrl: './messages.html',
  styleUrls: ['./messages.scss'],
  imports: [CommonModule, DatePipe, ReactiveFormsModule, FormsModule],
})
export class ArtistMessagesComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('msgEnd') msgEnd!: ElementRef;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  private http      = inject(HttpClient);
  private sanitizer = inject(DomSanitizer);
  private fb        = inject(FormBuilder);
  auth   = inject(AuthService);
  socket = inject(SocketService);

  private API  = `${environment.apiUrl}/messages`;
  private BASE = environment.apiUrl.replace('/api', '');
  private subs = new Subscription();

  threads: Thread[]      = [];
  activeThread: Thread | null = null;
  activeOther: ChatUser | null = null;
  messages: ChatMessage[] = [];

  loadingThreads = true;
  loadingMsgs    = false;
  sending        = false;
  threadsErr     = '';
  msgsErr        = '';

  // Typing — show ONLY when the OTHER person is typing
  otherTyping = false;
  private typingTimer: any;
  private stopTypingTimer: any;

  // Image attachment
  selectedImage: File | null = null;
  imagePreview: string | null = null;

  // Lightbox
  lightboxUrl: SafeUrl | null = null;
  lightboxOpen = false;

  // Contact picker
  showContactPicker = false;
  contactList: ChatUser[]  = [];
  loadingContacts  = false;
  contactSearch    = '';

  form = this.fb.group({ content: [''] });

  private shouldScroll = false;
  private myId() { return this.auth.currentUser()?._id ?? ''; }

  // ── Lifecycle ──────────────────────────────────────────
  ngOnInit() {
    this.socket.connect();
    this.loadThreads();
    this.subscribeToSocket();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    clearTimeout(this.typingTimer);
    clearTimeout(this.stopTypingTimer);
  }

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      try { this.msgEnd?.nativeElement.scrollIntoView({ behavior: 'smooth' }); } catch {}
      this.shouldScroll = false;
    }
  }

  // ── Socket subscriptions ───────────────────────────────
  private subscribeToSocket() {
    // A message sent TO me by someone else
    this.subs.add(this.socket.message$.subscribe((data: any) => {
      const msg: ChatMessage = data.message ?? data;
      const threadId = data.threadId ?? msg.thread;

      // Only show if it's from the OTHER person (not my own send echoed back)
      if (msg.sender?._id === this.myId()) return;

      if (this.activeThread && threadId === this.activeThread._id) {
        if (!this.messages.find(m => m._id === msg._id)) {
          this.messages = [...this.messages, msg];
          this.shouldScroll = true;
        }
        // Mark as read immediately since the panel is open
        if (this.activeOther) {
          this.socket.sendRead(this.activeThread._id, this.activeOther._id);
        }
      }
      // Refresh thread list to update last-message preview + unread count
      this.refreshThreads();
    }));

    // The other person is typing — guard: only show if it's the OTHER user, not me
    this.subs.add(this.socket.typing$.subscribe((data: any) => {
      if (!this.activeOther) return;
      if (data.fromUserId !== this.activeOther._id) return; // ignore own typing bounced back
      this.otherTyping = true;
      clearTimeout(this.typingTimer);
      this.typingTimer = setTimeout(() => (this.otherTyping = false), 3000);
    }));

    this.subs.add(this.socket.stopTyping$.subscribe((data: any) => {
      if (this.activeOther && data.fromUserId === this.activeOther._id) {
        this.otherTyping = false;
      }
    }));

    // The OTHER user read MY messages → update isRead on my sent messages
    this.subs.add(this.socket.messageRead$.subscribe((data: any) => {
      if (!this.activeThread) return;
      if (data.threadId !== this.activeThread._id) return;
      this.messages = this.messages.map(m =>
        m.sender?._id === this.myId() ? { ...m, isRead: true } : m
      );
    }));

    // Online/offline — just subscribe so the signal updates trigger CD
    this.subs.add(this.socket.userOnline$.subscribe(() => {}));
    this.subs.add(this.socket.userOffline$.subscribe(() => {}));
  }

  // ── Thread management ──────────────────────────────────
  loadThreads() {
    this.loadingThreads = true;
    this.http.get<any>(`${this.API}/threads`).subscribe({
      next: r => {
        this.threads        = r.threads ?? [];
        this.loadingThreads = false;
        // Auto-open first thread only when no thread is active yet
        if (!this.activeThread && this.threads.length > 0) {
          this.openThread(this.threads[0]);
        }
      },
      error: () => {
        this.loadingThreads = false;
        this.threadsErr = 'Impossible de charger les conversations.';
      },
    });
  }

  /** Refresh thread list without auto-opening any thread */
  private refreshThreads() {
    this.http.get<any>(`${this.API}/threads`).subscribe({
      next: r => { this.threads = r.threads ?? []; },
    });
  }

  openThread(t: Thread) {
    this.activeThread = t;
    this.activeOther  = this.otherParticipant(t);
    this.otherTyping  = false;
    this.messages     = [];
    this.msgsErr      = '';
    this.loadMsgs();
  }

  openWithUser(user: ChatUser) {
    this.showContactPicker = false;
    this.activeOther = user;
    this.otherTyping = false;
    this.messages    = [];
    this.http.get<any>(`${this.API}/thread/${user._id}`).subscribe({
      next: r => {
        this.activeThread = r.thread;
        this.loadMsgs();
      },
      error: () => { this.msgsErr = "Impossible d'ouvrir la conversation."; },
    });
  }

  private loadMsgs() {
    if (!this.activeOther) return;
    this.loadingMsgs = true;
    this.http.get<any>(`${this.API}/thread/${this.activeOther._id}/messages`).subscribe({
      next: r => {
        this.messages    = r.messages ?? [];
        this.loadingMsgs = false;
        this.shouldScroll = true;
        // Mark as read via socket
        if (this.activeThread && this.activeOther) {
          this.socket.sendRead(this.activeThread._id, this.activeOther._id);
        }
        this.refreshThreads();
      },
      error: () => { this.loadingMsgs = false; this.msgsErr = 'Impossible de charger les messages.'; },
    });
  }

  // ── Contact picker ────────────────────────────────────
  openContactPicker() {
    this.showContactPicker = true;
    this.contactSearch = '';
    if (this.contactList.length === 0) this.loadContacts();
  }

  loadContacts() {
    this.loadingContacts = true;
    // Single endpoint returns ALL messageable users (artists + production + admin)
    this.http.get<any>(`${this.API}/contacts`).subscribe({
      next: r => { this.contactList = r.contacts ?? []; this.loadingContacts = false; },
      error: () => {
        // Fallback: try legacy /artists
        this.http.get<any>(`${this.API}/artists`).subscribe({
          next: a => { this.contactList = a.artists ?? []; this.loadingContacts = false; },
          error: () => { this.loadingContacts = false; },
        });
      },
    });
  }

  get filteredContacts(): ChatUser[] {
    if (!this.contactSearch.trim()) return this.contactList;
    const q = this.contactSearch.toLowerCase();
    return this.contactList.filter(c =>
      (c.aka ?? c.firstName ?? '').toLowerCase().includes(q)
    );
  }

  // ── Image attachment ──────────────────────────────────
  onImageSelected(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.selectedImage = file;
    const reader = new FileReader();
    reader.onload = ev => (this.imagePreview = ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  clearImage() {
    this.selectedImage = null;
    this.imagePreview  = null;
    if (this.fileInput?.nativeElement) this.fileInput.nativeElement.value = '';
  }

  // ── Lightbox ──────────────────────────────────────────
  openLightbox(url: string) {
    this.lightboxUrl  = this.sanitizer.bypassSecurityTrustUrl(url);
    this.lightboxOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closeLightbox() {
    this.lightboxOpen = false;
    this.lightboxUrl  = null;
    document.body.style.overflow = '';
  }

  // ── Send ──────────────────────────────────────────────
  send() {
    const content = (this.form.value.content ?? '').trim();
    if ((!content && !this.selectedImage) || !this.activeOther || this.sending) return;

    this.sending = true;
    clearTimeout(this.stopTypingTimer);
    this.socket.sendStopTyping(this.activeOther._id);

    const fd = new FormData();
    fd.append('toUserId', this.activeOther._id);
    if (content)             fd.append('content', content);
    if (this.selectedImage)  fd.append('attachment', this.selectedImage);

    this.http.post<any>(this.API, fd).subscribe({
      next: r => {
        // Add the sent message directly — do NOT wait for socket echo
        if (!this.messages.find(m => m._id === r.message._id)) {
          this.messages = [...this.messages, r.message];
        }
        this.sending      = false;
        this.shouldScroll = true;
        this.form.reset();
        this.clearImage();
        this.refreshThreads();
      },
      error: () => {
        this.sending = false;
        this.msgsErr = "Le message n'a pas pu être envoyé.";
      },
    });
  }

  onTyping() {
    if (!this.activeOther) return;
    this.socket.sendTyping(this.activeOther._id);
    clearTimeout(this.stopTypingTimer);
    this.stopTypingTimer = setTimeout(() => {
      if (this.activeOther) this.socket.sendStopTyping(this.activeOther._id);
    }, 2000);
  }

  // ── Helpers ───────────────────────────────────────────
  otherParticipant(t: Thread): ChatUser | null {
    const me = this.myId();
    return t.participants?.find(p => p._id !== me) ?? null;
  }

  unreadFor(t: Thread): number {
    return t.unreadCounts?.find(u => u.user === this.myId())?.count ?? 0;
  }

  isMe(m: ChatMessage) { return m.sender?._id === this.myId(); }

  displayName(u: ChatUser | null) { return u?.aka ?? u?.firstName ?? 'NORTH PROD'; }

  initial(u: ChatUser | null) {
    return (this.displayName(u))[0]?.toUpperCase() ?? 'N';
  }

  roleLabel(u: ChatUser | null) {
    if (!u?.role) return '';
    const map: Record<string, string> = {
      admin: 'Administration',
      production: 'Équipe Production',
      artist: 'Artiste',
    };
    return map[u.role] ?? u.role;
  }

  roleBadgeClass(u: ChatUser | null) {
    return u?.role === 'admin' ? 'badge-admin'
      : u?.role === 'production' ? 'badge-prod'
      : 'badge-artist';
  }

  isImage(a?: Attachment) { return !!a && a.mimeType?.startsWith('image/'); }

  attachUrl(a: Attachment) {
    if (!a.url) return '';
    if (a.url.startsWith('http')) return a.url;
    return `${this.BASE}${a.url}`;
  }

  isOnline(id?: string) { return id ? this.socket.isOnline(id) : false; }

  lastMsgPreview(t: Thread): string {
    const lm = t.lastMessage;
    if (!lm) return 'Démarrer la conversation';
    if (lm.attachment && !lm.content) return '📷 Image';
    return lm.content ?? '';
  }
}
