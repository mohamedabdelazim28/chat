import { ChatService, ChatThread } from './../services/chat-service';
import {
  Component,
  ElementRef,
  inject,
  OnInit,
  ViewChild,
  HostListener,
  Input,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { map, BehaviorSubject } from 'rxjs';
import { DomSanitizer } from '@angular/platform-browser';

type UiChatThread = {
  messageId: string;
  showMenu?: boolean;
  menuOpen?: boolean;
  showReactions?: boolean;
  isEditing?: boolean;
  editBody?: string;
  messages?: any[];
  voiceMessages?: any[];
  sender?: string;
  content?: string;
  createdOn?: Date | string;
  avatar?: string;
  type?: string;
  name?: string;
  body?: string;
  reactions?: any[];
  confirmDelete?: boolean;
  deletedForEveryone?: boolean;
  deletedForMe?: boolean;
  userId: string | number;
  photo: string;
};

@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
  templateUrl: './chat-window.html',
  styleUrls: ['./chat-window.scss'],
})
export class ChatWindowcomponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  private ChatService = inject(ChatService);
  private SelectedUserId = this.ChatService.SelectedUserId;

  // ✅ Reactive messages
  private messagesSubject = new BehaviorSubject<UiChatThread[]>([]);
  messages$ = this.messagesSubject.asObservable();

  public myUserId = 534;
  emojiInput = '';

  constructor() { }

  availableReactions: any[] = [];
  @Input() selectedChatId: string | null = null;

  ngOnInit(): void {
    this.ChatService.getAllReactions().subscribe({
      next: (res: any) => {
        this.availableReactions = res.data;
      },
      error: (err) => console.log('Error fetching reactions', err),
    });

    this.SelectedUserId.subscribe((userId) => {
      this.messagesSubject.next([]); // reset messages
      if (userId) {
        this.ChatService.getChatByUserId(userId as number)
          .pipe(
            map((res: any) =>
              res.data.map((msg: any) => ({
                messageId: msg.messageId ?? msg.id,
                sender:
                  msg.fromUser.id === this.myUserId
                    ? 'You'
                    : msg.fromUser.firstName + ' ' + msg.fromUser.lastName,
                content: msg.body,
                createdOn: new Date(msg.createdOn + 'Z'),
                avatar: msg.fromUser.photo,
                type: 'text',
              }))
            )
          )
          .subscribe({
            next: (msgs: any[]) => {
              const current = this.messagesSubject.value;
              this.messagesSubject.next([...msgs, ...current]);
            },
            error: (err) => console.error('Error loading conversations:', err),
          });
      }
    });
  }

  messageInput: string = '';
  showEmojiPicker: boolean = false;
  showAttachmentMenu: boolean = false;

  // Emoji
  toggleEmojiPicker() {
    this.showEmojiPicker = !this.showEmojiPicker;
  }
  addEmoji(reaction: any) {
    this.showEmojiPicker = false;
    this.emojiInput = reaction.id;
  }

  // ✅ Send Message
  sendMessage() {
    if (this.messageInput.trim() && this.SelectedUserId.value) {
      const payload = {
        userId: this.SelectedUserId.value,
        body: this.messageInput,
        voiceFileId: null,
        attachmentId: null,
        groupId: null,
        messageCode: this.emojiInput ?? '',
      };

      this.ChatService.sendNewMessage(payload).subscribe({
        next: () => {
          const newMsg: UiChatThread = {
            messageId: Date.now().toLocaleString(),
            userId: payload.userId,
            sender: 'You',
            name: 'You',
            photo: 'assets/imges/Ellipse 514.svg',
            content: this.messageInput,
            messages: [
              {
                userId: payload.userId,
                body: this.messageInput,
                type: 'text',
                createdOn: new Date().toISOString(),
                photo: 'assets/imges/Ellipse 514.svg',
              },
            ],
            type: 'text',
            createdOn: new Date().toISOString()
          };

          const current = this.messagesSubject.value;
          this.messagesSubject.next([newMsg, ...current]);

          this.messageInput = '';
        },
        error: (err) => {
          console.error('Error sending message:', err);
          alert('Failed to send message');
        },
      });
    }
  }

  // Attachments
  toggleAttachmentMenu() {
    this.showAttachmentMenu = !this.showAttachmentMenu;
  }
  triggerFileInput(type: string) {
    this.fileInput.nativeElement.accept = type;
    this.fileInput.nativeElement.click();
    this.showAttachmentMenu = false;
  }
  handleFileUpload(event: any) {
    const file = event.target.files[0];
    if (file) {
      const fileUrl = URL.createObjectURL(file);
      const base = {
        userId: 694,
        sender: 'You',
        name: 'You',
        photo: 'assets/imges/Ellipse 514.svg',
        createdOn: new Date().toISOString(),
        unreadCount: 0,
        totalCount: 1,
      };

      const newMsg: UiChatThread =
        file.type.startsWith('image/')
          ? {
            ...base,
            body: fileUrl,
            type: 'image',
            messageId: Date.now().toLocaleString(),
            messages: [
              {
                userId: 694,
                body: fileUrl,
                type: 'image',
                createdOn: base.createdOn,
                photo: 'assets/imges/Ellipse 514.svg',
              },
            ],
          }
          : {
            ...base,
            body: file.name,
            type: 'file',
            messageId: Date.now().toLocaleString(),
            messages: [
              {
                userId: 694,
                body: file.name,
                type: 'file',
                createdOn: base.createdOn!,
                photo: 'assets/imges/Ellipse 514.svg',
              },
            ],
          };

      const current = this.messagesSubject.value;
      this.messagesSubject.next([newMsg, ...current]);
    }
  }

  // Audio Recording
  mediaRecorder: any;
  audioChunks: any[] = [];
  isRecording: boolean = false;

  async startRecording() {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Microphone not supported in this browser');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event: any) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, {
          type: 'audio/webm;codecs=opus',
        });
        const audioUrl = URL.createObjectURL(audioBlob);

        const newMsg: UiChatThread = {
          userId: 694,
          sender: 'You',
          name: 'You',
          photo: 'assets/imges/Ellipse 514.svg',
          body: audioUrl,
          type: 'audio',
          messageId: Date.now().toLocaleString(),
          messages: [
            {
              userId: 694,
              body: audioUrl,
              type: 'audio',
              createdOn: new Date().toISOString(),
              photo: 'assets/imges/Ellipse 514.svg',
            },
          ],
          createdOn: new Date().toISOString()
        };

        const current = this.messagesSubject.value;
        this.messagesSubject.next([newMsg, ...current]);
      };

      this.mediaRecorder.start();
      this.isRecording = true;
    } catch (err) {
      console.error('Error accessing microphone', err);
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.isRecording = false;
  }

  toggleRecording() {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      this.startRecording();
    }
  }

  // UI helpers
  @HostListener('document:click', ['$event'])
  clickOutside(event: Event) {
    if (
      !(event.target as HTMLElement).closest('.message-menu') &&
      !(event.target as HTMLElement).closest('.reaction-picker')
    ) {
      this.closeAllMenus();
    }
  }

  closeAllMenus() {
    const updated = this.messagesSubject.value.map((m) => ({
      ...m,
      menuOpen: false,
      showReactions: false,
    }));
    this.messagesSubject.next(updated);
  }

  toggleMenu(msg: UiChatThread, event: Event) {
    event.stopPropagation();
    !msg.showMenu ? this.closeAllMenus() : null;
    msg.menuOpen = true;
    msg.showMenu = !msg.showMenu

  }

  copyMessage(msg: UiChatThread) {
    const text =
      !msg.type || msg.type === 'text'
        ? msg.body ?? ''
        : typeof msg.body === 'string'
          ? msg.body
          : '';
    navigator.clipboard.writeText(text || '');
    msg.menuOpen = false;
  }

  editMessage(msg: UiChatThread) {
    if (!msg.type || msg.type === 'text') {
      msg.isEditing = true;
      msg.editBody = msg.body;
    }
    msg.menuOpen = false;
  }

  saveEdit(msg: UiChatThread) {
    if (typeof msg.editBody === 'string') {
      msg.body = msg.editBody;

      if (Array.isArray(msg.messages) && msg.messages.length) {
        const last = msg.messages[msg.messages.length - 1];
        if (last && (!last.type || last.type === 'text')) {
          last.body = msg.editBody;
        }
      }

      msg.isEditing = false;
      this.ChatService.editMessage(Number(msg.messageId), msg.editBody).subscribe({
        next: (res: any) => {
          console.log('Message updated on server', res);
        },
        error: (err) => {
          console.error('Error updating message:', err);
        },
      });
    }
  }

  cancelEdit(msg: UiChatThread) {
    msg.isEditing = false;
    msg.editBody = msg.body;
  }

  confirmDelete(msg: UiChatThread, type: 'everyone' | 'me') {
    if (type === 'everyone') {
      this.ChatService.deleteMessage(msg.messageId).subscribe({
        next: () => {
          msg.deletedForEveryone = true;
          msg.deletedForMe = false;
          msg.content = "";
          const newMessages = this.messagesSubject.value.map(m =>
            m.messageId === msg.messageId ? msg : m
          );
          this.messagesSubject.next(newMessages);
        },
      });
    } else if (type === 'me') {
      this.ChatService.deleteForMe(msg.messageId).subscribe({
        next: () => {
          msg.deletedForMe = true;
          msg.deletedForEveryone = false;
          msg.content = "";
          const newMessages = this.messagesSubject.value.map(m =>
            m.messageId === msg.messageId ? msg : m
          );
          this.messagesSubject.next(newMessages);
        },
      });
    }
    msg.confirmDelete = false;
  }

  openReactions(msg: UiChatThread, event: Event) {
    event.stopPropagation();
    this.closeAllMenus();
    msg.showReactions = true;
  }

  setReaction(msg: UiChatThread, reaction: any) {
    const payload = {
      messageId: Number(msg.messageId ?? 0),
      userId: this.myUserId,
      reactionId: reaction.id,
    };

    this.ChatService.addMessageReaction(payload).subscribe({
      next: () => {
        msg.reactions = [reaction];
        msg.showReactions = false;
      },
      error: (err) => console.error('Error adding reaction:', err),
    });
  }
}
