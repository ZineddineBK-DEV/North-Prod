import { Component, OnInit, inject, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

interface Message { _id:string; sender:any; content:string; createdAt:string; isRead:boolean; }
interface Conversation { _id:string; participants:any[]; lastMessage?:Message; updatedAt:string; }

@Component({
  selector: 'app-artist-messages',
  templateUrl: './messages.html',
  styleUrls: ['./messages.scss'],
  imports: [CommonModule, DatePipe, ReactiveFormsModule],
})
export class ArtistMessagesComponent implements OnInit, AfterViewChecked {
  @ViewChild('msgEnd') msgEnd!: ElementRef;
  private http = inject(HttpClient);
  auth = inject(AuthService);
  private fb = inject(FormBuilder);

  conversations: Conversation[] = [];
  activeConvo: Conversation | null = null;
  messages: Message[] = [];
  loadingConvos = true;
  loadingMsgs = false;

  form = this.fb.group({ content: ['', [Validators.required, Validators.minLength(1)]] });

  private shouldScroll = false;
  private API = `${environment.apiUrl}/messages`;

  ngOnInit() { this.loadConversations(); }
  ngAfterViewChecked() {
    if (this.shouldScroll && this.msgEnd) {
      this.msgEnd.nativeElement.scrollIntoView({ behavior:'smooth' });
      this.shouldScroll = false;
    }
  }

  loadConversations() {
    this.loadingConvos = true;
    this.http.get<any>(`${this.API}/conversations`).subscribe({
      next: r => { this.conversations = r.conversations || []; this.loadingConvos = false; },
      error: () => { this.loadingConvos = false; },
    });
  }

  selectConvo(c: Conversation) {
    this.activeConvo = c;
    this.loadingMsgs = true;
    this.http.get<any>(`${this.API}/conversations/${c._id}`).subscribe({
      next: r => { this.messages = r.messages || []; this.loadingMsgs = false; this.shouldScroll = true; },
      error: () => { this.loadingMsgs = false; },
    });
  }

  send() {
    if (this.form.invalid || !this.activeConvo) return;
    const content = this.form.value.content!.trim();
    this.form.reset();
    this.http.post<any>(`${this.API}/conversations/${this.activeConvo._id}`, { content }).subscribe({
      next: r => { this.messages = [...this.messages, r.message]; this.shouldScroll = true; },
    });
  }

  getOtherParticipant(c: Conversation) {
    const me = this.auth.currentUser()?._id;
    return c.participants?.find((p:any) => p._id !== me);
  }

  isMe(msg: Message) { return msg.sender?._id === this.auth.currentUser()?._id; }
}
