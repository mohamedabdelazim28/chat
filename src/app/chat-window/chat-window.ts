import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';


@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule, PickerComponent ],
  templateUrl: './chat-window.html',
  styleUrls: ['./chat-window.scss'],
})
export class ChatWindow  {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

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

  // Audio Recording
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
