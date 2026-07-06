import { Component, OnInit, OnDestroy, inject, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { SocketService } from '../../../core/services/socket.service';
import { NotificationService } from '../../../core/services/notification.service';
import { environment } from '../../../../environments/environment';

interface ChatUser   { _id: string; aka?: string; firstName?: string; avatar?: string; role?: string; }
interface Attachment  { name: string; url: string; mimeType: string; size: number; }
interface ChatMessage {
  _id: string; thread: string; sender: ChatUser; receiver: string;
  content: string; attachment?: Attachment; isRead: boolean; createdAt: string;
}
interface Thread {
  _id: string; participants: ChatUser[]; lastMessage?: ChatMessage;
  lastMessageAt?: string; unreadCounts?: { user: string; count: number }[];
}

@Component({
  selector: 'app-artist-messages',
  templateUrl: './messages.html',
  styleUrls: ['./messages.scss'],
  imports: [CommonModule, DatePipe, ReactiveFormsModule],
})
export class ArtistMessagesComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('msgEnd')   msgEnd!:    ElementRef;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  private http     = inject(HttpClient);
  private fb       = inject(FormBuilder);
  auth             = inject(AuthService);
  private socket   = inject(SocketService);
  private notifSvc = inject(NotificationService);

  private API  = `${environment.apiUrl}/messages`;
  private subs = new Subscription();

  threads:      Thread[]     = [];
  activeThread: Thread | null = null;
  activeOther:  ChatUser | null = null;
  messages:     ChatMessage[] = [];

  contacts:        ChatUser[] = [];
  showContacts     = false;
  contactsLoading  = false;
  contactSearch    = '';

  loadingThreads = true;
  loadingMsgs    = false;
  sending        = false;
  threadsErr     = '';
  msgsErr        = '';

  otherTyping   = false;
  onlineUsers   = new Set<string>();
  private typingTimeout: any;
  private shouldScroll = false;

  selectedImage: File | null = null;
  imagePreview               = '';

  form = this.fb.group({ content: [''] });

  private myId() { return this.auth.currentUser()?._id || ''; }

  get filteredContacts() {
    const q = this.contactSearch.toLowerCase();
    return q ? this.contacts.filter(c => (c.aka || c.firstName || '').toLowerCase().includes(q))
             : this.contacts;
  }

  ngOnInit() {
    this.socket.connect();
    this.loadThreads();

    // ── Incoming message ──────────────────────────────────
    this.subs.add(this.socket.message$.subscribe((data: any) => {
      const msg: ChatMessage = data.message || data;

      // Append to open conversation if it matches
      if (this.activeThread && msg.thread === this.activeThread._id) {
        // Avoid duplicates (sent via HTTP already appended)
        if (!this.messages.find(m => m._id === msg._id)) {
          this.messages = [...this.messages, msg];
          this.shouldScroll = true;
        }
        if (this.activeOther) {
          this.socket.sendRead(this.activeOther._id, this.activeThread._id);
        }
      }

      // Update sidebar thread preview without full reload
      const existingThread = this.threads.find(t => t._id === msg.thread);
      if (existingThread) {
        existingThread.lastMessage    = msg;
        existingThread.lastMessageAt  = msg.createdAt;
        if (msg.thread !== this.activeThread?._id) {
          const uc = existingThread.unreadCounts?.find(u => u.user === this.myId());
          if (uc) uc.count++;
        }
        // Move to top
        this.threads = [existingThread, ...this.threads.filter(t => t._id !== existingThread._id)];
      } else {
        // New thread from unknown sender — reload list once
        this.loadThreads();
      }

      this.notifSvc.refreshCount();
    }));

    // ── Typing ────────────────────────────────────────────
    this.subs.add(this.socket.typing$.subscribe((data: any) => {
      if (this.activeOther && data.fromUserId === this.activeOther._id) {
        this.otherTyping = true;
        clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => this.otherTyping = false, 3000);
      }
    }));
    this.subs.add(this.socket.stopTyping$.subscribe((data: any) => {
      if (this.activeOther && data.fromUserId === this.activeOther._id) this.otherTyping = false;
    }));

    // ── Presence ──────────────────────────────────────────
    this.subs.add(this.socket.userOnline$.subscribe( (d: any) => this.onlineUsers.add(d.userId)));
    this.subs.add(this.socket.userOffline$.subscribe((d: any) => this.onlineUsers.delete(d.userId)));
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    clearTimeout(this.typingTimeout);
  }

  ngAfterViewChecked() {
    if (this.shouldScroll && this.msgEnd) {
      this.msgEnd.nativeElement.scrollIntoView({ behavior: 'smooth' });
      this.shouldScroll = false;
    }
  }

  // ── Thread loading ────────────────────────────────────────
  loadThreads() {
    this.loadingThreads = true;
    this.threadsErr = '';
    this.http.get<any>(`${this.API}/threads`).subscribe({
      next: r => {
        this.threads = r.threads || [];
        this.loadingThreads = false;
        // Auto-open first thread only on initial load
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

  openThread(t: Thread) {
    this.activeThread = t;
    this.activeOther  = this.getOtherParticipant(t);
    this.showContacts = false;
    this.loadMessagesForThread();
  }

  openWithUser(user: ChatUser) {
    this.showContacts = false;
    this.contactSearch = '';
    this.activeOther  = user;
    this.loadingMsgs  = true;
    this.msgsErr      = '';

    this.http.get<any>(`${this.API}/thread/${user._id}`).subscribe({
      next: r => {
        this.activeThread = r.thread;
        // Add thread to list if not present
        if (!this.threads.find(t => t._id === r.thread._id)) {
          this.threads = [r.thread, ...this.threads];
        }
        this.loadMessagesForThread();
      },
      error: () => {
        this.loadingMsgs = false;
        this.msgsErr = "Impossible d'ouvrir la conversation.";
      },
    });
  }

  private loadMessagesForThread() {
    if (!this.activeOther) { this.loadingMsgs = false; return; }
    this.loadingMsgs = true;
    this.msgsErr     = '';
    this.http.get<any>(`${this.API}/thread/${this.activeOther._id}/messages`).subscribe({
      next: r => {
        this.messages    = r.messages || [];
        this.loadingMsgs = false;
        this.shouldScroll = true;
        this.markThreadRead(this.activeThread!._id);
        if (this.activeOther) this.socket.sendRead(this.activeOther._id, this.activeThread!._id);
      },
      error: () => {
        this.loadingMsgs = false;
        this.msgsErr = 'Impossible de charger les messages.';
      },
    });
  }

  private markThreadRead(threadId: string) {
    const t = this.threads.find(x => x._id === threadId);
    const uc = t?.unreadCounts?.find(u => u.user === this.myId());
    if (uc) uc.count = 0;
  }

  // ── Contacts ──────────────────────────────────────────────
  toggleContacts() {
    this.showContacts = !this.showContacts;
    if (this.showContacts && this.contacts.length === 0) this.loadContacts();
  }

  loadContacts() {
    this.contactsLoading = true;
    this.http.get<any>(`${this.API}/contacts`).subscribe({
      next: r => { this.contacts = r.contacts || []; this.contactsLoading = false; },
      error: () => { this.contactsLoading = false; },
    });
  }

  // ── Send ──────────────────────────────────────────────────
  send() {
    const content = this.form.value.content?.trim() || '';
    if ((!content && !this.selectedImage) || !this.activeOther || this.sending) return;

    this.sending = true;
    this.socket.sendStopTyping(this.activeOther._id);

    const fd = new FormData();
    fd.append('toUserId', this.activeOther._id);
    if (content) fd.append('content', content);
    if (this.selectedImage) fd.append('attachment', this.selectedImage);

    this.form.reset();
    this.clearImage();

    this.http.post<any>(this.API, fd).subscribe({
      next: r => {
        // Append the sent message immediately (don't wait for socket echo)
        this.messages = [...this.messages, r.message];
        this.shouldScroll = true;
        this.sending = false;

        // Update thread sidebar preview
        if (this.activeThread) {
          this.activeThread.lastMessage   = r.message;
          this.activeThread.lastMessageAt = r.message.createdAt;
        }

        this.socket.sendDelivered(this.activeOther!._id, r.message._id);
      },
      error: () => {
        this.sending = false;
        this.msgsErr = "Le message n'a pas pu être envoyé.";
      },
    });
  }

  onTyping() { if (this.activeOther) this.socket.sendTyping(this.activeOther._id); }

  onFileSelected(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) { alert('Seules les images sont autorisées.'); return; }
    this.selectedImage = f;
    const reader = new FileReader();
    reader.onload = r => this.imagePreview = r.target?.result as string;
    reader.readAsDataURL(f);
  }

  clearImage() {
    this.selectedImage = null;
    this.imagePreview  = '';
    if (this.fileInput?.nativeElement) this.fileInput.nativeElement.value = '';
  }

  // ── Helpers ───────────────────────────────────────────────
  getOtherParticipant(t: Thread): ChatUser | null {
    const me = this.myId();
    return t.participants?.find(p => p._id !== me) || null;
  }
  unreadFor(t: Thread): number {
    return t.unreadCounts?.find(u => u.user === this.myId())?.count || 0;
  }
  isMe(msg: ChatMessage)          { return msg.sender?._id === this.myId(); }
  displayName(u: ChatUser | null) { return u?.aka || u?.firstName || 'NORTH PROD'; }
  initial(u: ChatUser | null)     { return (this.displayName(u))[0]?.toUpperCase() || 'N'; }
  isOnline(u: ChatUser | null)    { return u ? this.onlineUsers.has(u._id) : false; }
  roleLabel(u: ChatUser | null) {
    return ({ admin: 'Administrateur', production: 'Équipe Production', artist: 'Artiste' })[u?.role || ''] || '';
  }
  isImage(a: Attachment)  { return a?.mimeType?.startsWith('image/'); }
  openImage(url: string)  { window.open(url, '_blank'); }
  apiBase = environment.apiUrl.replace('/api', '');
}
