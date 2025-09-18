import { ChatService, Reaction } from './../services/chat-service';
import {
  Component,
  ElementRef,
  inject,
  OnInit,
  ViewChild,
  HostListener,
  Input,
  ChangeDetectorRef,
  EventEmitter,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { map, BehaviorSubject, Observable } from 'rxjs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

type UiChatThread = {
  messageId: string | number;
  showMenu?: boolean;
  menuOpen?: boolean;
  showReactions?: boolean;
  isEditing?: boolean;
  editBody?: string;
  messages?: any[];
  sender?: string;
  content?: string;
  createdOn?: Date | string;
  avatar?: string;
  type?: string;
  name?: string;
  body?: string;
  reactions?: any[]; // depends on API shape
  confirmDelete?: boolean;
  deletedForEveryone?: boolean;
  deletedForMe?: boolean;
  userId?: string | number;
  messageCode?: number | string;
  reaction?: string | null;
};

@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
  templateUrl: './chat-window.html',
  styleUrls: ['./chat-window.scss'],
})
export class ChatWindowcomponent implements OnInit {
  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef<HTMLInputElement>;

  private chatService = inject(ChatService);
  private SelectedUserId = this.chatService.SelectedUserId;
  messagesSubject = new BehaviorSubject<UiChatThread[]>([]);
  messages$: Observable<UiChatThread[]> = this.messagesSubject.asObservable();
  public messages: UiChatThread[] = [];
  private cdRef = inject(ChangeDetectorRef);
  private sanitizer = inject(DomSanitizer);

  public myUserId = 534;
  baseURL = 'https://devbe.ariseorganization.com';
  lastSeen: string | null = null;

  availableReactions$ = this.chatService.availableReactions;

  @Input() selectedChatId: string | null = null;
  @Input() isMobile: boolean = false;
  @Output() backToList = new EventEmitter<void>();

  isRecording = false;
  messageInput = '';
  showEmojiPicker = false;
  showAttachmentMenu = false;
  emojiInput: string = '';

  constructor() {}

  ngOnInit(): void {
    // subscribe to selected user and load messages
    this.SelectedUserId.subscribe((userId) => {
      this.messagesSubject.next([]); // reset messages
      this.messages = [];
      if (userId) {
        this.chatService.getChatByUserId(userId as number)
          .pipe(
            map((res: any) =>
              res.data.map((msg: any) => {
                const isImage = !!(msg.body && /data:image|https?:\/\/.*\.(png|jpg|jpeg|gif)/i.test(msg.body));
                const reactionIcon = msg.messageCode ? this.availableReactions$.value.find((r: any) => r.id == msg.messageCode)?.icon : null;
                return {
                  messageId: msg.messageId ?? msg.id,
                  sender: (msg.fromUser?.id === this.myUserId) ? 'You' : `${msg.fromUser?.firstName || ''} ${msg.fromUser?.lastName || ''}`,
                  messageCode: msg.messageCode,
                  content: msg.body && !isImage ? msg.body : '',
                  body: isImage ? msg.body : (msg.body || ''),
                  reaction: reactionIcon,
                  reactions: msg.reactions || [],
                  createdOn: new Date(msg.createdOn + 'Z'),
                  avatar: msg.fromUser?.photo || 'assets/imges/Ellipse 514.svg',
                  type: isImage ? 'image' : (msg.type || 'text'),
                } as UiChatThread;
              })
            )
          )
          .subscribe({
            next: (msgs: UiChatThread[]) => {
              // append newest at top (as original code did)
              const combined = [...msgs, ...this.messagesSubject.value];
              this.messagesSubject.next(combined);
            },
            error: (err) => console.error('Error loading conversations:', err),
          });
      }
    });
  }

  // helper to update BehaviorSubject and local array
  private updateMessage(updated: UiChatThread) {
    const newList = this.messagesSubject.value.map((m) =>
      m.messageId === updated.messageId ? { ...m, ...updated } : m
    );
    this.messagesSubject.next(newList);
    this.cdRef.detectChanges();
  }

  // UI helpers
  goBackToChatList() { this.backToList.emit(); }

  isImage(path: string): boolean {
    return !!path && /\.(jpg|jpeg|png|gif)/i.test(path);
  }

  getImageUrl(path: string) {
    return `${this.baseURL}/${path}`;
  }

  toggleEmojiPicker(evt?: Event) {
    if (evt) evt.stopPropagation();
    this.showEmojiPicker = !this.showEmojiPicker;
    if (this.showEmojiPicker) this.closeAllMenus();
  }

  addEmoji(reaction: any) {
    // add emoji to the messageInput (as reaction code) but no alt text
    this.showEmojiPicker = false;
    this.emojiInput = String(reaction.id);
    // optional: show a preview or directly send
    const imgTag = `<img src="${reaction.icon}" alt="" width="20" height="20" style="vertical-align: middle;" />`;
    // append sanitized preview inside input (or handle differently)
    this.messageInput = this.messageInput ? (this.messageInput + ' ') : '';
    // we keep a hidden emojiInput to send to API
  }

  sendMessage() {
    if ((!this.messageInput.trim() && !this.emojiInput) || !this.SelectedUserId.value) return;

    const payload = {
      userId: this.SelectedUserId.value,
      body: this.messageInput,
      voiceFileId: null,
      attachmentId: null,
      groupId: null,
      messageCode: this.emojiInput || ''
    };

    this.chatService.sendNewMessage(payload).subscribe({
      next: (res: any) => {
        // create local message using response if available
        const newMsg: UiChatThread = {
          messageId: res?.id ?? Date.now(),
          userId: payload.userId,
          sender: 'You',
          name: 'You',
          body: payload.body,
          content: payload.body,
          messageCode: payload.messageCode ? Number(payload.messageCode) : undefined,
          reaction: payload.messageCode ? this.availableReactions$.value.find(r => r.id === +payload.messageCode)?.icon : null,
          reactions: [],
          type: payload.messageCode ? 'image' : 'text',
          createdOn: new Date().toISOString(),
          avatar: 'assets/imges/Ellipse 514.svg'
        };
        // prepend to list
        this.messagesSubject.next([newMsg, ...this.messagesSubject.value]);
        // reset inputs
        this.messageInput = '';
        this.emojiInput = '';
        this.cdRef.detectChanges();
      },
      error: (err) => {
        console.error('Failed sending message', err);
        alert('Failed to send message');
      }
    });
  }

  // attachments
  toggleAttachmentMenu(evt?: Event) {
    if (evt) evt.stopPropagation();
    this.showAttachmentMenu = !this.showAttachmentMenu;
    if (this.showAttachmentMenu) this.closeAllMenus();
  }

  triggerFileInput(type: string) {
    this.fileInput.nativeElement.accept = type;
    this.fileInput.nativeElement.click();
    this.showAttachmentMenu = false;
  }

  handleFileUpload(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;
    const fileUrl = URL.createObjectURL(file);

    const newMsg: UiChatThread = {
      messageId: Date.now(),
      sender: 'You',
      body: file.type.startsWith('image/') ? fileUrl : file.name,
      type: file.type.startsWith('image/') ? 'image' : 'file',
      createdOn: new Date().toISOString(),
      avatar: 'assets/imges/Ellipse 514.svg',
      reactions: []
    };

    this.messagesSubject.next([newMsg, ...this.messagesSubject.value]);
    // optionally upload file to server here...
  }

  // recording (kept same)
  mediaRecorder: any;
  audioChunks: any[] = [];

  async startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];
      this.mediaRecorder.ondataavailable = (e: any) => { if (e.data.size) this.audioChunks.push(e.data); };
      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const newMsg: UiChatThread = {
          messageId: Date.now(),
          sender: 'You',
          body: url,
          type: 'audio',
          createdOn: new Date().toISOString(),
          avatar: 'assets/imges/Ellipse 514.svg'
        };
        this.messagesSubject.next([newMsg, ...this.messagesSubject.value]);
      };
      this.mediaRecorder.start();
      this.isRecording = true;
    } catch (err) { console.error(err); alert('Mic access denied or not supported'); }
  }

  stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.isRecording = false;
  }

  toggleRecording() {
    this.isRecording ? this.stopRecording() : this.startRecording();
  }

  // clicks outside -> close menus
  @HostListener('document:click', ['$event'])
  clickOutside(event: Event) {
    const el = event.target as HTMLElement;
    if (!el.closest('.dropdown') && !el.closest('.reaction-picker') && !el.closest('.emoji-picker') && !el.closest('.attachment-menu')) {
      this.closeAllMenus();
    }
  }

  closeAllMenus() {
    const updated = this.messagesSubject.value.map((m) => ({ ...m, menuOpen: false, showReactions: false }));
    this.messagesSubject.next(updated);
    this.cdRef.detectChanges();
  }

  toggleMenu(msg: UiChatThread, event: Event) {
    event.stopPropagation();
    // toggle single menu and close others
    const newList = this.messagesSubject.value.map((m) => {
      if (m.messageId === msg.messageId) {
        return { ...m, menuOpen: !m.menuOpen, showReactions: false };
      }
      return { ...m, menuOpen: false, showReactions: false };
    });
    this.messagesSubject.next(newList);
  }

  copyMessage(msg: UiChatThread) {
    const text = msg.type === 'text' ? (msg.body || msg.content || '') : (typeof msg.body === 'string' ? msg.body : '');
    navigator.clipboard.writeText(text || '');
    // close menu
    msg.menuOpen = false;
    this.updateMessage(msg);
  }

  editMessage(msg: UiChatThread) {
    if (!msg.type || msg.type === 'text') {
      msg.isEditing = true;
      msg.editBody = msg.body ?? msg.content ?? '';
      msg.menuOpen = false;
      this.updateMessage(msg);
    }
  }

  saveEdit(msg: UiChatThread) {
    if (typeof msg.editBody !== 'string') return;
    this.chatService.editMessage(Number(msg.messageId), msg.editBody).subscribe({
      next: (res: any) => {
        // prefer server response if provided
        msg.body = res?.body ?? msg.editBody;
        msg.content = msg.body;
        msg.isEditing = false;
        // update last message item in messages array if present
        this.updateMessage(msg);
      },
      error: (err) => {
        console.error('Error updating message', err);
        // fallback to local update
        msg.body = msg.editBody;
        msg.isEditing = false;
        this.updateMessage(msg);
      }
    });
  }

  cancelEdit(msg: UiChatThread) {
    msg.isEditing = false;
    msg.editBody = msg.body ?? msg.content;
    this.updateMessage(msg);
  }

  confirmDelete(msg: UiChatThread, type: 'everyone' | 'me') {
    if (type === 'everyone') {
      this.chatService.deleteMessage(msg.messageId).subscribe({
        next: () => {
          msg.deletedForEveryone = true;
          msg.deletedForMe = false;
          msg.body = '';
          msg.content = '';
          this.updateMessage(msg);
        },
        error: (err) => console.error('Error deleting for everyone', err)
      });
    } else {
      this.chatService.deleteForMe(msg.messageId).subscribe({
        next: () => {
          msg.deletedForMe = true;
          msg.deletedForEveryone = false;
          msg.body = '';
          msg.content = '';
          this.updateMessage(msg);
        },
        error: (err) => console.error('Error deleting for me', err)
      });
    }
    msg.confirmDelete = false;
  }

  openReactions(msg: UiChatThread, event: Event) {
    event.stopPropagation();
    // close menus and open reaction picker for this message
    const newList = this.messagesSubject.value.map((m) => {
      if (m.messageId === msg.messageId) {
        return { ...m, showReactions: !m.showReactions, menuOpen: false };
      }
      return { ...m, showReactions: false, menuOpen: false };
    });
    this.messagesSubject.next(newList);
  }

  setReaction(msg: UiChatThread, reaction: any) {
    const payload = {
      messageId: Number(msg.messageId ?? 0),
      userId: this.myUserId,
      reactionId: reaction.id
    };
    this.chatService.addMessageReaction(payload).subscribe({
      next: (res: any) => {
        // expect server to return updated reactions list or single reaction
        if (res?.reactions) {
          msg.reactions = res.reactions;
        } else {
          msg.reactions = [...(msg.reactions || []), reaction];
        }
        msg.showReactions = false;
        msg.menuOpen = false;
        this.updateMessage(msg);
      },
      error: (err) => console.error('Error adding reaction:', err)
    });
  }
}
