import { Component, OnInit, OnDestroy, inject, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
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
  _id: string; participants: ChatUser[]; lastMessage?: ChatMessage;
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

  private http   = inject(HttpClient);
  private fb     = inject(FormBuilder);
  auth   = inject(AuthService);
  socket = inject(SocketService);

  private API  = `${environment.apiUrl}/messages`;
  private BASE = environment.apiUrl.replace('/api', '');
  private subs = new Subscription();

  threads: Thread[]   = [];
  activeThread: Thread | null = null;
  activeOther: ChatUser | null = null;
  messages: ChatMessage[] = [];

  loadingThreads = true;
  loadingMsgs    = false;
  sending        = false;
  threadsErr     = '';
  msgsErr        = ''
  noContact      = false;

  otherTyping = false;
  private typingTimeout: any;
  private typingDebounce: any;

  // Image attachment
  selectedImage: File | null = null;
  imagePreview: string | null = null;

  // New conversation modal
  showContactPicker = false;
  contactList: ChatUser[] = [];
  loadingContacts   = false;
  contactSearch     = '';

  form = this.fb.group({ content: [''] });

  private shouldScroll = false;
  private myId() { return this.auth.currentUser()?._id; }

  ngOnInit() {
    this.socket.connect();
    this.loadThreads();

    this.subs.add(this.socket.message$.subscribe((data: any) => {
      const msg: ChatMessage = data.message || data;
      if (this.activeThread && msg.thread === this.activeThread._id) {
        // Avoid duplicates
        if (!this.messages.find(m => m._id === msg._id)) {
          this.messages = [...this.messages, msg];
          this.shouldScroll = true;
        }
        this.markThreadRead(this.activeThread._id);
        if (this.activeOther) {
          this.socket.sendRead(this.activeThread._id, this.activeOther._id);
        }
      }
      this.loadThreads();
    }));

    this.subs.add(this.socket.typing$.subscribe((data: any) => {
      if (this.activeOther && data.fromUserId === this.activeOther._id) {
        this.otherTyping = true;
        clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => this.otherTyping = false, 3000);
      }
    }));

    this.subs.add(this.socket.stopTyping$.subscribe((data: any) => {
      if (this.activeOther && data.fromUserId === this.activeOther._id) {
        this.otherTyping = false;
      }
    }));

    this.subs.add(this.socket.messageRead$.subscribe((data: any) => {
      // Mark our sent messages as read when the other person reads them
      if (this.activeThread && data.threadId === this.activeThread._id) {
        this.messages = this.messages.map(m =>
          m.sender?._id === this.myId() ? { ...m, isRead: true } : m
        );
      }
    }));

    this.subs.add(this.socket.messageDelivered$.subscribe((data: any) => {
      if (this.activeThread && data.threadId === this.activeThread._id) {
        this.messages = this.messages.map(m =>
          m._id === data.messageId ? { ...m, isDelivered: true } : m
        );
      }
    }));

    // Online/offline status refresh
    this.subs.add(this.socket.userOnline$.subscribe(() => {}));
    this.subs.add(this.socket.userOffline$.subscribe(() => {}));
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    clearTimeout(this.typingTimeout);
    clearTimeout(this.typingDebounce);
  }

  ngAfterViewChecked() {
    if (this.shouldScroll && this.msgEnd) {
      this.msgEnd.nativeElement.scrollIntoView({ behavior: 'smooth' });
      this.shouldScroll = false;
    }
  }

  // ── Thread management ──────────────────────────────────
  loadThreads() {
    this.loadingThreads = true; this.threadsErr = '';
    this.http.get<any>(`${this.API}/threads`).subscribe({
      next: r => {
        this.threads = r.threads || [];
        this.loadingThreads = false;
        if (!this.activeThread && this.threads.length > 0) {
          this.openThread(this.threads[0]);
        }
      },
      error: () => { this.loadingThreads = false; this.threadsErr = 'Impossible de charger les conversations.'; },
    });
  }

  openThread(t: Thread) {
    this.activeThread = t;
    this.activeOther  = this.getOtherParticipant(t);
    this.loadMessagesForActiveThread();
  }

  openWithUser(user: ChatUser) {
    this.loadingMsgs = true; this.msgsErr = '';
    this.activeOther = user;
    this.showContactPicker = false;
    this.http.get<any>(`${this.API}/thread/${user._id}`).subscribe({
      next: r => { this.activeThread = r.thread; this.loadMessagesForActiveThread(); },
      error: () => { this.loadingMsgs = false; this.msgsErr = "Impossible d'ouvrir la conversation."; },
    });
  }

  private loadMessagesForActiveThread() {
    if (!this.activeOther) { this.loadingMsgs = false; return; }
    this.loadingMsgs = true; this.msgsErr = '';
    this.http.get<any>(`${this.API}/thread/${this.activeOther._id}/messages`).subscribe({
      next: r => {
        this.messages = r.messages || [];
        this.loadingMsgs = false;
        this.shouldScroll = true;
        if (this.activeThread) {
          this.markThreadRead(this.activeThread._id);
          this.socket.sendRead(this.activeThread._id, this.activeOther!._id);
        }
      },
      error: () => { this.loadingMsgs = false; this.msgsErr = 'Impossible de charger les messages.'; },
    });
  }

  private markThreadRead(threadId: string) {
    const t = this.threads.find(x => x._id === threadId);
    if (t?.unreadCounts) {
      const mine = t.unreadCounts.find(u => u.user === this.myId());
      if (mine) mine.count = 0;
    }
  }

  // ── Contact picker ────────────────────────────────────
  openContactPicker() {
    this.showContactPicker = true;
    this.contactSearch = '';
    if (this.contactList.length === 0) this.loadContacts();
  }

  loadContacts() {
    this.loadingContacts = true;
    // Load studio contacts first
    this.http.get<any>(`${this.API}/contact`).subscribe({
      next: r => {
        // Load artist peers
        this.http.get<any>(`${this.API}/artists`).subscribe({
          next: a => {
            const studio = r.contact ? [r.contact] : [];
            this.contactList = [...studio, ...(a.artists || [])];
            this.loadingContacts = false;
          },
          error: () => {
            this.contactList = r.contact ? [r.contact] : [];
            this.loadingContacts = false;
          },
        });
      },
      error: () => {
        // Fall back to artist list only
        this.http.get<any>(`${this.API}/artists`).subscribe({
          next: a => { this.contactList = a.artists || []; this.loadingContacts = false; },
          error: () => { this.loadingContacts = false; this.noContact = true; },
        });
      },
    });
  }

  get filteredContacts(): ChatUser[] {
    if (!this.contactSearch) return this.contactList;
    const q = this.contactSearch.toLowerCase();
    return this.contactList.filter(c =>
      (c.aka || c.firstName || '').toLowerCase().includes(q)
    );
  }

  // ── Image attachment ──────────────────────────────────
  onImageSelected(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Seules les images sont acceptées (jpg, png, gif, webp)');
      return;
    }
    this.selectedImage = file;
    const reader = new FileReader();
    reader.onload = (r) => this.imagePreview = r.target?.result as string;
    reader.readAsDataURL(file);
  }

  clearImage() {
    this.selectedImage = null;
    this.imagePreview  = null;
    if (this.fileInput) this.fileInput.nativeElement.value = '';
  }

  // ── Send ──────────────────────────────────────────────
  send() {
    const content = this.form.value.content?.trim() || '';
    if ((!content && !this.selectedImage) || !this.activeOther || this.sending) return;

    this.sending = true;
    this.socket.sendStopTyping(this.activeOther._id);

    const fd = new FormData();
    fd.append('toUserId', this.activeOther._id);
    if (content) fd.append('content', content);
    if (this.selectedImage) fd.append('attachment', this.selectedImage);

    this.http.post<any>(this.API, fd).subscribe({
      next: r => {
        this.messages = [...this.messages, r.message];
        this.sending = false;
        this.shouldScroll = true;
        this.form.reset();
        this.clearImage();
        this.loadThreads();
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
    clearTimeout(this.typingDebounce);
    this.typingDebounce = setTimeout(() => {
      if (this.activeOther) this.socket.sendStopTyping(this.activeOther._id);
    }, 2000);
  }

  isOnline(userId: string) { return this.socket.isOnline(userId); }

  // ── Helpers ───────────────────────────────────────────
  getOtherParticipant(t: Thread): ChatUser | null {
    const me = this.myId();
    return t.participants?.find(p => p._id !== me) || null;
  }
  unreadFor(t: Thread): number {
    return t.unreadCounts?.find(u => u.user === this.myId())?.count || 0;
  }
  isMe(msg: ChatMessage) { return msg.sender?._id === this.myId(); }
  displayName(u: ChatUser | null) { return u?.aka || u?.firstName || 'NORTH PROD'; }
  initial(u: ChatUser | null) { return (this.displayName(u))[0]?.toUpperCase() || 'N'; }
  roleLabel(u: ChatUser | null) {
    const map: Record<string,string> = { admin:'Administration', production:'Équipe Production', artist:'Artiste' };
    return u?.role ? (map[u.role] || u.role) : '';
  }
  attachmentIsImage(a: Attachment) { return a.mimeType?.startsWith('image/'); }
  attachmentUrl(a: Attachment) {
    if (a.url.startsWith('http')) return a.url;
    return `${this.BASE}${a.url}`;
  }
  startNewConversation() { this.openContactPicker(); }
}
