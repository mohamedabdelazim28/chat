import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';

export interface ChatThread {
  userId: number;
  name: string;
  photo: string;
  body: string;
  message?:string;
  lastMessage: string;
  messages: any[];
  lastMessageTime: Date;
  unreadCount: number;
  totalCount: number;
  sender?: string;
  fromUserId?: number;
  type?: string;
  time?: string;
  reaction?: string;
  showReactions?: boolean;
  menuOpen?: boolean;
  showMenu?: boolean;
  isEditing?: boolean;
  attachmentId?: string | null;
  voiceFileId?: string | null;
  msgId?: string | null;
  reactions?: string[];
  recordedChunks?: any[];
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private allMessages: ChatThread[] = [];
  public SelectedUserId = new BehaviorSubject<number | null>(null);

  private http = inject(HttpClient);
  private baseURL = 'https://devbe.ariseorganization.com';
  private jwtToken = "Bearer eyJhbGciOiJodHRwOi8vd3d3LnczLm9yZy8yMDAxLzA0L3htbGRzaWctbW9yZSNobWFjLXNoYTI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoic2FtaXJhIGhhc3NhbiIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL25hbWVpZGVudGlmaWVyIjoiNTM0IiwiaHR0cDovL3NjaGVtYXMueG1sc29hcC5vcmcvd3MvMjAwNS8wNS9pZGVudGl0eS9jbGFpbXMvZW1haWxhZGRyZXNzIjoic2FtaXJhaGFzc2FubjQ0QGdtYWlsLmNvbSIsInVpZCI6IjUzNCIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6IkZhbWlseSBNZW1iZXIiLCJleHAiOjE3NTcyODAwNTEsImlzcyI6IklkZW50aXR5IiwiYXVkIjoiSWRlbnRpdHlVc2VyIn0.NnzVL_eaUsIct1_kB5N82bVt02PRCaM04OGo21k733M"

  conversations: any[] = [];

  sendNewMessage(payload: {
    userId: number;
    body: string;
    voiceFileId?: string | null;
    attachmentId?: string | null;
    groupId?: number | null;
    messageCode?: string;
  }) {
    return this.http.post(`${this.baseURL}/api/Message/SendNewMessage`, payload, {
      headers: {
        'Authorization': this.jwtToken,
        'Content-Type': 'application/json'
      }
    });
  }

  getusermessage(pageSize: number, pageNumber: number) {
    return this.http.get<{ data: any[] }>(`${this.baseURL}/api/Message/GetUserChatMessages`, {
      headers: {
        'Authorization': this.jwtToken,
      },
      params: { WithUserId: '694', PageSize: pageSize, PageNumber: pageNumber  },
    });
  }

  GetUserOutgoingMessages(pageSize: number, pageNumber: number) {
    return this.http.get<{ data: any[] }>(`${this.baseURL}/api/Message/GetUserOutgoingMessages`, {
      headers: {
        'Authorization': this.jwtToken,
      },
      params: { PageSize: pageSize, PageNumber: pageNumber },
    });
  }

  getUserChatsById(): Observable<any[]> {
    return this.SelectedUserId.pipe(
      map((userId) => {
        const messages = this.allMessages.find((c) => c.userId === userId)?.messages;
        return messages ?? [];
      })
    );
  }

  setSelectedUser(UserId: number) {
    this.SelectedUserId.next(UserId);
  }

  setMessages(messages: ChatThread[]) {
    this.allMessages = messages;
  }

  private selectedChatSource = new BehaviorSubject<ChatThread | null>(null);
  selectedChat$ = this.selectedChatSource.asObservable();

  setSelectedChat(chat: ChatThread) {
    this.selectedChatSource.next(chat);
  }

  getConversations() {
    return this.http.get<{ data: ChatThread[] }>(`${this.baseURL}/api/Message/GetUserChats`, {
      headers: {
        'Authorization': this.jwtToken,
      }
    });
  }

  addMessageReaction(payload: { messageId: number; userId: number; reactionId: number }) {
    return this.http.post(`${this.baseURL}/api/Message/AddMessageReaction`, payload, {
      headers: {
        'Authorization': this.jwtToken,
        'Content-Type': 'application/json'
      }
    });
  }
}
