import { Component, OnInit, OnDestroy, inject, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { SocketService } from '../../../core/services/socket.service';
import { environment } from '../../../../environments/environment';

interface ChatUser { _id: string; aka?: string; firstName?: string; avatar?: string; role?: string; }
interface Attachment { name: string; url: string; mimeType: string; size: number; }
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
  @ViewChild('msgEnd') msgEnd!: ElementRef;

  private http   = inject(HttpClient);
  private fb     = inject(FormBuilder);
  auth   = inject(AuthService);
  private socket = inject(SocketService);

  private API = `${environment.apiUrl}/messages`;
  private subs = new Subscription();

  threads: Thread[]   = [];
  activeThread: Thread | null = null;
  activeOther: ChatUser | null = null;
  messages: ChatMessage[] = [];

  loadingThreads = true;
  loadingMsgs    = false;
  sending        = false;
  threadsErr     = '';
  msgsErr        = '';
  noContact      = false;

  otherTyping = false;
  private typingTimeout: any;

  form = this.fb.group({ content: ['', [Validators.required, Validators.minLength(1)]] });

  private shouldScroll = false;
  private myId() { return this.auth.currentUser()?._id; }

  ngOnInit() {
    this.socket.connect();
    this.loadThreads();

    this.subs.add(this.socket.message$.subscribe((data: any) => {
      const msg: ChatMessage = data.message || data;
      // If the message belongs to the open thread, append it live
      if (this.activeThread && msg.thread === this.activeThread._id) {
        this.messages = [...this.messages, msg];
        this.shouldScroll = true;
        this.markThreadRead(this.activeThread._id);
      }
      this.loadThreads(); // refresh sidebar previews/order
    }));

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

  // ── Load conversation list ────────────────────────────────
  loadThreads() {
    this.loadingThreads = true; this.threadsErr = '';
    this.http.get<any>(`${this.API}/threads`).subscribe({
      next: r => {
        this.threads = r.threads || [];
        this.loadingThreads = false;
        // Auto-open the first thread if none is active yet
        if (!this.activeThread && this.threads.length > 0) {
          this.openThread(this.threads[0]);
        }
      },
      error: () => { this.loadingThreads = false; this.threadsErr = "Impossible de charger les conversations."; },
    });
  }

  // ── Start a brand-new conversation with the studio ────────
  startNewConversation() {
    this.noContact = false;
    this.http.get<any>(`${this.API}/contact`).subscribe({
      next: r => this.openWithUser(r.contact),
      error: () => { this.noContact = true; },
    });
  }

  openWithUser(user: ChatUser) {
    this.loadingMsgs = true; this.msgsErr = '';
    this.activeOther = user;
    this.http.get<any>(`${this.API}/thread/${user._id}`).subscribe({
      next: r => {
        this.activeThread = r.thread;
        this.loadMessagesForActiveThread();
      },
      error: () => { this.loadingMsgs = false; this.msgsErr = "Impossible d'ouvrir la conversation."; },
    });
  }

  openThread(t: Thread) {
    this.activeThread = t;
    this.activeOther = this.getOtherParticipant(t);
    this.loadMessagesForActiveThread();
  }

  private loadMessagesForActiveThread() {
    if (!this.activeOther) { this.loadingMsgs = false; return; }
    this.loadingMsgs = true; this.msgsErr = '';
    this.http.get<any>(`${this.API}/thread/${this.activeOther._id}/messages`).subscribe({
      next: r => {
        this.messages = r.messages || [];
        this.loadingMsgs = false;
        this.shouldScroll = true;
        if (this.activeThread) this.markThreadRead(this.activeThread._id);
      },
      error: () => { this.loadingMsgs = false; this.msgsErr = "Impossible de charger les messages."; },
    });
  }

  private markThreadRead(threadId: string) {
    const t = this.threads.find(x => x._id === threadId);
    if (t?.unreadCounts) {
      const mine = t.unreadCounts.find(u => u.user === this.myId());
      if (mine) mine.count = 0;
    }
  }

  // ── Send a message ─────────────────────────────────────────
  send() {
    if (this.form.invalid || !this.activeOther || this.sending) return;
    const content = this.form.value.content!.trim();
    if (!content) return;

    this.sending = true;
    this.form.reset();
    this.socket.sendStopTyping(this.activeOther._id);

    const fd = new FormData();
    fd.append('toUserId', this.activeOther._id);
    fd.append('content', content);

    this.http.post<any>(this.API, fd).subscribe({
      next: r => {
        this.messages = [...this.messages, r.message];
        this.sending = false;
        this.shouldScroll = true;
        this.loadThreads();
      },
      error: () => {
        this.sending = false;
        this.msgsErr = "Le message n'a pas pu être envoyé.";
        this.form.patchValue({ content });
      },
    });
  }

  onTyping() {
    if (!this.activeOther) return;
    this.socket.sendTyping(this.activeOther._id);
  }

  // ── Helpers ─────────────────────────────────────────────────
  getOtherParticipant(t: Thread): ChatUser | null {
    const me = this.myId();
    return t.participants?.find(p => p._id !== me) || null;
  }

  unreadFor(t: Thread): number {
    const mine = t.unreadCounts?.find(u => u.user === this.myId());
    return mine?.count || 0;
  }

  isMe(msg: ChatMessage) { return msg.sender?._id === this.myId(); }

  displayName(u: ChatUser | null) { return u?.aka || u?.firstName || 'NORTH PROD'; }
  initial(u: ChatUser | null) { return (this.displayName(u))[0]?.toUpperCase() || 'N'; }
}
