import { ChatService, ChatThread } from './../services/chat-service';
import { Component, ElementRef, inject, OnInit, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { map, Observable } from 'rxjs';

type UiChatThread = ChatThread & {
  showMenu?: boolean;
  menuOpen?: boolean;
  showReactions?: boolean;
  reaction?: string;
  isEditing?: boolean;
  editBody?: string;
  msgId?: string;
  messages?: any[];
  voiceMessages?: any[];
};

@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule, PickerComponent],
  templateUrl: './chat-window.html',
  styleUrls: ['./chat-window.scss'],
})
export class ChatWindowcomponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  private ChatService = inject(ChatService);
  private OutgoingMessages: ChatThread[] = [];
  private SelectedUserId = this.ChatService.SelectedUserId;
  private selectedChatMessages: any[] = [];
  myMessages$!: Observable<ChatThread[]>;
  public messages: any[] = [];


  kkk = [
    {
      sender: 'Ronald Richards',
      content: 'Hey friend! last using Arise app',
      time: '2m',
      avatar: 'assets/imges/Avatar.svg',
      type: 'text',
    },
    {
      sender: 'You',
      content: 'Hello Ronald!',
      time: '1m',
      avatar: 'assets/imges/Ellipse 514.svg',
      type: 'text',
    },
    {
      sender: 'Ronald Richards',
      content: 'Thank you for being here ❤️',
      time: '15m',
      avatar: 'assets/imges/Avatar.svg',
      type: 'text',
    }
  ]
  ngOnInit(): void {

    this.ChatService.GetUserOutgoingMessages(10, 1).subscribe((messages) => {

      if (messages.data) {

        this.OutgoingMessages = [...messages.data];
        this.myMessages$ = this.SelectedUserId.pipe(
          map((userId) => {
            console.log(userId)
            return userId
              ? this.OutgoingMessages
                .filter((c) => c.userId === userId)
                .map((c) => ({
                  ...(c as ChatThread),
                  sender: 'You',
                  body: c.message ?? '',
                }))
              : []
          }
          )
        );
      }

        let updatedMessages: ChatThread[] = [];
        this.ChatService.getUserChatsById().subscribe((msgs: ChatThread[]) => {
          console.log('msgs::',msgs)
          this.selectedChatMessages = [...msgs];
          updatedMessages = this.selectedChatMessages.map((c) => ({
            ...c,
            sender: c.fromUser.firstName + ' ' + c.fromUser.lastName,
          }));
          this.myMessages$?.subscribe((res) => {
            console.log(...res)
            this.messages = [...updatedMessages, ...res];
          });
       });
    });
  }

  messageInput: string = '';
  showEmojiPicker: boolean = false;
  showAttachmentMenu: boolean = false;

  // Emoji
  toggleEmojiPicker() {
    this.showEmojiPicker = !this.showEmojiPicker;
  }
  addEmoji(event: any) {
    this.messageInput += event.emoji.native;
    this.showEmojiPicker = false;
  }


  sendMessage() {
    if (this.messageInput.trim()) {
      const payload = {
        userId: this.SelectedUserId.value ?? 694,
        body: this.messageInput,
        voiceFileId: null,
        attachmentId: null,
        groupId: null,
        messageCode: new Date().getTime().toString(),
      };

      this.ChatService.sendNewMessage(payload).subscribe({
        next: () => {
          const newMsg: UiChatThread = {
            userId: payload.userId,
            sender: 'You',
            name: 'You',
            photo: 'assets/imges/Ellipse 514.svg',
            body: this.messageInput,
            lastMessage: this.messageInput,
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
            type: 'text',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            msgId: Date.now().toString() + '_' + Math.random().toString(36).slice(2),
          };

          this.messages = [...this.messages, newMsg];
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
      const base: Partial<UiChatThread> = {
        userId: 694,
        sender: 'You',
        name: 'You',
        photo: 'assets/imges/Ellipse 514.svg',
        lastMessageTime: new Date(),
        unreadCount: 0,
        totalCount: 1,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        msgId: Date.now().toString() + '_' + Math.random().toString(36).slice(2),
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
              time: base.time!,
              photo: 'assets/imges/Ellipse 514.svg',
            },
          ],
          type: 'image',
        } as UiChatThread);
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
              time: base.time!,
              photo: 'assets/imges/Ellipse 514.svg',
            },
          ],
          type: 'file',
        } as UiChatThread);
      }
    }
  }

  // Audio Recording
  mediaRecorder: any;
  audioChunks: any[] = [];
  isRecording: boolean = false;
  voiceMessages: UiChatThread[] = [];

  async startRecording() {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Microphone not supported in this browser');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event: any) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm;codecs=opus' });
        const audioUrl = URL.createObjectURL(audioBlob);

        const base: UiChatThread = {
          userId: 694,
          sender: 'You',
          name: 'You',
          photo: 'assets/imges/Ellipse 514.svg',
          body: audioUrl,
          lastMessage: '[Voice Message]',
          messages: [
            {
              userId: 694,
              body: audioUrl,
              type: 'audio',
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              photo: 'assets/imges/Ellipse 514.svg',
            },
          ],
          lastMessageTime: new Date(),
          unreadCount: 0,
          totalCount: 1,
          type: 'audio',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          msgId: Date.now().toString() + '_' + Math.random().toString(36).slice(2),
        };

        this.voiceMessages.push(base);
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



  @HostListener('document:click', ['$event'])
  clickOutside(event: Event) {
    if (!(event.target as HTMLElement).closest('.message-menu') &&
      !(event.target as HTMLElement).closest('.reaction-picker')) {
      this.closeAllMenus();
    }
  }

  closeAllMenus() {
    this.messages.forEach((m) => {
      m.menuOpen = false;
      m.showReactions = false;
    });
  }

  toggleMenu(msg: UiChatThread, event: Event) {
    event.stopPropagation();
    this.closeAllMenus();
    msg.menuOpen = true;
  }

  copyMessage(msg: UiChatThread) {
    const text =
      (!msg.type || msg.type === 'text') ? (msg.body ?? '') : (typeof msg.body === 'string' ? msg.body : '');
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
    }
    msg.isEditing = false;
  }

  cancelEdit(msg: UiChatThread) {
    msg.isEditing = false;
    msg.editBody = msg.body;
  }

  deleteMessage(msg: UiChatThread) {
    this.messages = this.messages.filter((m) => m.msgId !== msg.msgId);
  }

  openReactions(msg: UiChatThread, event: Event) {
    event.stopPropagation();
    this.closeAllMenus();
    msg.showReactions = true;
  }

  setReaction(msg: UiChatThread, reaction: string) {
    msg.reaction = reaction;
    msg.showReactions = false;
  }
}
