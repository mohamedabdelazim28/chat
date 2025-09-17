import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';

export interface ChatThread {
  id: number;
  userId: number;
  photo: string;
  firstName: string;
  lastName: string,
  userName: string;
  message: string;
  sendDate: string;
  numberOfUnread: number;
  isReaded: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  uploadAttachment(formData: FormData) {
    throw new Error('Method not implemented.');
  }
  private allMessages: ChatThread[] = [];
  public SelectedUserId = new BehaviorSubject<number | null>(null);

  private http = inject(HttpClient);
  private baseURL = 'https://devbe.ariseorganization.com';
  private jwtToken = "Bearer eyJhbGciOiJodHRwOi8vd3d3LnczLm9yZy8yMDAxLzA0L3htbGRzaWctbW9yZSNobWFjLXNoYTI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoic2FtaXJhIGhhc3NhbiIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL25hbWVpZGVudGlmaWVyIjoiNTM0IiwiaHR0cDovL3NjaGVtYXMueG1sc29hcC5vcmcvd3MvMjAwNS8wNS9pZGVudGl0eS9jbGFpbXMvZW1haWxhZGRyZXNzIjoic2FtaXJhaGFzc2FubjQ0QGdtYWlsLmNvbSIsInVpZCI6IjUzNCIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6IkZhbWlseSBNZW1iZXIiLCJleHAiOjE3NTgxMDc5OTUsImlzcyI6IklkZW50aXR5IiwiYXVkIjoiSWRlbnRpdHlVc2VyIn0.Ndq7pFlIdSuJlL2EVRuULk3Oj1jEmFONIlor6dB4Gi4";
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
    return this.http.get<{ data: ChatThread[], totalCount: number }>(`${this.baseURL}/api/Message/GetUserOutgoingMessages`, {
      headers: {
        'Authorization': this.jwtToken,
      },
      params: { WithUserId: '534', PageSize: pageSize, PageNumber: pageNumber },
    });
  }


  getChatByUserId(UserId: number) {
    return this.http.get(`${this.baseURL}/api/Message/GetUserChatMessages`, {
      headers: {
        'Authorization': this.jwtToken,
      },
      params: { WithUserId: String(UserId) },
    });
  }
  setSelectedUser(UserId: number) {
    this.SelectedUserId.next(UserId);
    console.log(UserId);
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

  getAllReactions() {
    return this.http.get(`${this.baseURL}/api/Master/GetAllReactions`, {
      headers: {
        'Authorization': this.jwtToken,
      },
    });
  }

  deleteMessage(messageId: string | number) {
  const params = new HttpParams().set('MessageId', messageId.toString());

  return this.http.delete(`${this.baseURL}/api/Message/DeleteMessage`, {
    headers: { Authorization: this.jwtToken },
    params
  });
}

deleteForMe(messageId: string | number) {
  const params = new HttpParams().set('MessageId', messageId.toString());

  return this.http.delete(`${this.baseURL}/api/Message/DeleteMessageFromMe`, {
    headers: { Authorization: this.jwtToken },
    params
  });
}

editMessage(messageId: number, message: string) {
  const body = {
    messageId: messageId,
    message: message
  };

  return this.http.post(`${this.baseURL}/api/Message/EditMessage`, body, {
    headers: {
      'Authorization': this.jwtToken,
      'Content-Type': 'application/json'
    }
  });
}

}
