import { ChatService, ChatThread } from './../services/chat-service';
import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { map, Observable } from 'rxjs';



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
  private SelectedUserId = this.ChatService.SelectedUserId
  private selectedChatMessages: any[] = [];
  private myMessages$ !: Observable<ChatThread[]>
  // public  messages : ChatThread[] = []


  ngOnInit(): void {
    this.ChatService
      .GetUserOutgoingMessages(10, 1)
      .subscribe((messages) => {
        console.log(messages);
        this.OutgoingMessages = [...messages.data]
        this.myMessages$ = this.SelectedUserId.pipe(
          map((userId) =>
            userId ? this.OutgoingMessages.filter((c) => c.userId === userId).map((c) => { return { ...c, sender: 'You' } }) : []
          )
        );
        let updatedMessages: ChatThread[] = [];
        this.ChatService.getUserChatsById().subscribe((messages: ChatThread[]) => {
          this.selectedChatMessages = [...messages];
          updatedMessages = this.selectedChatMessages.map((c) => { return { ...c, sender: c.fromUser.firstName + ' ' + c.fromUser.lastName } });
          // Move the subscription to myMessages$ here to ensure updatedMessages is set
          this.myMessages$.subscribe((messages) => {
            console.log("hhh", messages);
            // this.messages = [...messages, ...updatedMessages];
            // console.log(this.messages);
          });
        });
      })
  }


  messages = [
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
  ];

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

    console.log(event);
  }

  // Send Message
  sendMessage() {
    if (this.messageInput.trim()) {
      this.messages.push({
        sender: 'You',
        content: this.messageInput,
        type: 'text',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        avatar: 'assets/imges/Ellipse 514.svg',
      });
      this.messageInput = '';

      // this.ChatService.SendMessage(this.messageInput).subscribe((res) => {
      //   console.log(res);
      // });

      // {
      //   "userId": 694,
      //     "body": "string",
      //       "voiceFileId": "string",
      //         "attachmentId": "string",
      //           "groupId": 0,
      //             "messageCode": "string"
      // }
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
      if (file.type.startsWith("image/")) {
        this.messages.push({
          sender: 'You',
          content: fileUrl,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          avatar: 'assets/imges/Ellipse 514.svg',
          type: 'image',
        });
      } else {
        this.messages.push({
          sender: 'You',
          content: file.name,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          avatar: 'assets/imges/Ellipse 514.svg',
          type: 'file',
        });
      }
    }
  }

  //   // Audio Recording
  mediaRecorder: MediaRecorder | null = null;
  audioChunks: Blob[] = [];
  isRecording = false;

  async startRecording() {
    try {
      if (!navigator.mediaDevices) {
        alert("Microphone not supported in this browser");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);

        this.messages.push({
          sender: 'You',
          content: audioUrl,
          type: 'audio',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          avatar: 'assets/imges/Ellipse 514.svg',
        });
      };

      this.mediaRecorder.start();
      this.isRecording = true;
    } catch (err) {
      console.error('Error accessing microphone', err);
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
    }
  }
}
