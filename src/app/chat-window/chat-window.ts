import { ChatService, ChatThread  } from './../services/chat-service';
import { Component, ElementRef, inject, OnInit, ViewChild, HostListener, Input, ChangeDetectorRef, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { EventEmitter } from '@angular/core';

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
   time?: Date | string;
  attachmentId?: string;

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

  private chatService = inject(ChatService);
  private SelectedUserId = this.chatService.SelectedUserId;
  messagesSubject = new BehaviorSubject<UiChatThread[]>([]);
  messages$: Observable<UiChatThread[]> = this.messagesSubject.asObservable();
  public messages: any[] = [];
  public myUserId = 534;
  public imageUrl: string | null = null;

  constructor(private cdr: ChangeDetectorRef, private sanitizer: DomSanitizer) { }

  baseURL = 'https://devbe.ariseorganization.com';

  availableReactions: any[] = [];
  @Input() selectedChatId: string | null = null;
  @Input() isMobile: boolean = false;
  @Output() backToList = new EventEmitter<void>();

  isChatWindowOpen = false;
 openChat(chatId: string) {
  this.selectedChatId = chatId;
  this.isChatWindowOpen = true;
}

goBackToChatList() {
  this.backToList.emit();
}

  isImage(path: string): boolean {
    return /\.(jpg|jpeg|png|gif)$/i.test(path);
  }



  getImageUrl(path: string): string {
    return `${this.baseURL}/${path}`;

  }

  ngOnInit(): void {

    this.chatService.getAllReactions().subscribe({
      next: (res: any) => {
        this.availableReactions = res.data;
      },
      error: (err) => console.log('Error fetching reactions', err),
    });




    console.log('SelectedUserId', this.SelectedUserId)

    this.SelectedUserId
      .subscribe((userId) => {
        console.log('userid', userId)
        this.messages = [];
        if (userId) {
          this.chatService.getChatByUserId(userId as number)
            .pipe(
              map((res: any) => {
                console.log('res', res)
                return res.data.map((msg: any) => {
                  console.log('msg', msg)
                  return {
                    messageId: msg.messageId ?? msg.id,
                    sender: msg.fromUser.id === this.myUserId ? 'You' : msg.fromUser.firstName + ' ' + msg.fromUser.lastName,
                    content: msg.body,
                    time: msg.createdOn,
                    avatar: msg.fromUser.photo,
                    type: "text",
                  };

                })
              }

              )
            ).subscribe({
              next: (msgs: any[]) => {
                this.messages = [...msgs, ...this.messages];
                console.log('this.messages', this.messages)
                this.cdr.detectChanges();
              },
              error: (err) => {
                console.error('Error loading conversations:', err);
              }

            })
        }
      })

  }

  messageInput: string = '';
  showEmojiPicker: boolean = false;
  showAttachmentMenu: boolean = false;
  safeMessage: SafeHtml = '';
  safecontent: SafeHtml = '';
  messageEmoji: string = '';
  emojiInput: string = '';

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
    if (this.messageInput.trim() || this.imageUrl) {
      const payload = {
        userId: this.SelectedUserId.value ?? 694,
        body: this.messageInput,
        voiceFileId: null,
        attachmentId: null,
        groupId: null,
        messageCode: this.emojiInput ?? "",
      };

      this.chatService.sendNewMessage(payload).subscribe({
        next: () => {
          this.safecontent = this.sanitizer.bypassSecurityTrustHtml(this.messageEmoji);
          const newMsg = {
            messageId: Date.now(),
            userId: payload.userId,
            sender: 'You',
            name: 'You',
            photo: 'assets/imges/Ellipse 514.svg',
            content: this.imageUrl ? this.imageUrl : this.messageInput,
            type: this.imageUrl ? 'image' : 'text',
            time: Date.now().toString() + '_' + Math.random().toString(36).slice(2),
            message: "",
            messages: [
              {
                userId: payload.userId,
                body: this.messageInput,
                type: 'text',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                photo: 'assets/imges/Ellipse 514.svg',
              },
            ],
            lastMessageTime: new Date(),
            unreadCount: 0,
            totalCount: 1,
            msgId: Date.now().toString() + '_' + Math.random().toString(36).slice(2),
          };

          this.messages = [newMsg, ...this.messages];
          this.messageInput = '';
          console.log('window' + this.messages);
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
        userId: this.SelectedUserId.value ?? 694,
        sender: 'You',
        name: 'You',
        photo: 'assets/imges/Ellipse 514.svg',
        createdOn: new Date().toISOString(),
        unreadCount: 0,
        totalCount: 1,
      };

      if (file.type.startsWith('image/')) {
        this.messages.push({
          ...base,
          body: fileUrl,
          lastMessage: fileUrl,
          messages: [
            {
              userId: 694,
              body: fileUrl,
              type: 'image',
              time: new Date(),
              photo: 'assets/imges/Ellipse 514.svg',
            },
          ],
          type: 'image',
        });
      } else {
        this.messages.push({
          ...base,
          body: file.name,
          lastMessage: file.name,
          messages: [
            {
              userId: 694,
              body: file.name,
              type: 'file',
              time: new Date(),
              photo: 'assets/imges/Ellipse 514.svg',
            },
          ],
          type: 'file',
        });
      }
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
      const lastIndex = msg.messages.length - 1;
      const last = msg.messages[lastIndex];
      if (last && (!last.type || last.type === 'text')) {

        msg.messages = [
          ...msg.messages.slice(0, lastIndex),
          { ...last, body:  msg.editBody },
        ];
      }
    }

      msg.isEditing = false;
      this.chatService.editMessage(Number(msg.messageId), msg.editBody).subscribe({
        next: (res: any) => {
          console.log('Message updated on server', res);
        },
        error: (err) => {
          console.error('Error updating message:', err);

        }
      });
    }
  }


  cancelEdit(msg: UiChatThread) {
    msg.isEditing = false;
    msg.editBody = msg.body;
  }

  confirmDelete(msg: UiChatThread, type: 'everyone' | 'me') {
    if (type === 'everyone') {
      this.chatService.deleteMessage(msg.messageId).subscribe({
        next: () => {
          msg.deletedForEveryone = true;
          msg.deletedForMe = false;
          msg.content = ''; // نخفي الرسالة الأصلية
        }
      });
    } else if (type === 'me') {
      this.chatService.deleteForMe(msg.messageId).subscribe({
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

    this.chatService.addMessageReaction(payload).subscribe({
      next: () => {
        msg.reactions = [reaction];
        msg.showReactions = false;
      },
      error: (err) => console.error('Error adding reaction:', err),
    });
  }
}
