import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';

export interface ChatThread {
  userId: number;
  name: string;
  photo: string;
  lastMessage: string;
  messages: any[];
  lastMessageTime: Date;
  unreadCount: number;
  totalCount: number;
  sender?: string;
  fromUserId?: number;
}

@Injectable({
  providedIn: 'root'
})


export class ChatService {

  private allMessages: ChatThread[] = []; // assume you set this after grouping
  public SelectedUserId = new BehaviorSubject<number| null>(null);

  private http = inject(HttpClient);
  private baseURL= 'https://devbe.ariseorganization.com'
  private jwtToken ='Bearer eyJhbGciOiJodHRwOi8vd3d3LnczLm9yZy8yMDAxLzA0L3htbGRzaWctbW9yZSNobWFjLXNoYTI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoiTW9oYW1lZCBBYmRlbEF6aW0iLCJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjY5NCIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL2VtYWlsYWRkcmVzcyI6Im1vaGFtZWRhYmRlbGF6aW0yODRAZ21haWwuY29tIiwidWlkIjoiNjk0IiwiaHR0cDovL3NjaGVtYXMubWljcm9zb2Z0LmNvbS93cy8yMDA4LzA2L2lkZW50aXR5L2NsYWltcy9yb2xlIjoiR3Vlc3QiLCJHZXRBbGxOYXRpb25hbGl0aWVzIjoidHJ1ZSIsImV4cCI6MTc4NzY4MTI4MywiaXNzIjoiSWRlbnRpdHkiLCJhdWQiOiJJZGVudGl0eVVzZXIifQ.5EfbgAiM-77FlWecX3YB5yyVTMohKkgyckUU0e4FVL0';

  conversations: any[] = [];

  sendMessage(message: any) {
    return this.http.post(`${this.baseURL}/api/Message/SendMessage`, message, {
      headers: {
        'Authorization': this.jwtToken,
      }
    });
  }

  getusermessage(pageSize: number, pageNumber: number){

  return this.http.get<{data:any[]}>(`${this.baseURL}/api/Message/GetUserChatMessages`,{
    headers: {
    'Authorization': this.jwtToken,
  },

   params: {WithUserId: '694', PageSize: pageSize , PageNumber: pageNumber},

  });
  }
  GetUserOutgoingMessages(pageSize: number, pageNumber: number){
    return this.http.get<{data:any[]}>(`${this.baseURL}/api/Message/GetUserOutgoingMessages`,{
      headers: {
      'Authorization': this.jwtToken,
    },

     params: { PageSize: pageSize , PageNumber: pageNumber},

    });
    }


getUserChatsById(): Observable<any[]> {
  // return messages.find((c) => c.userId === userId)?.messages;
  return this.SelectedUserId.pipe(
    map((userId) => {
      const messages = this.allMessages.find((c) => c.userId === userId)?.messages;
      console.log('messages',messages);
      return messages ?? [];
    })
  );
}

  setSelectedUser(UserId) {
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
        return this.http.get<{data: ChatThread[]}>(`${this.baseURL}/api/Message/GetUserChats`, {
      headers: {
        'Authorization': this.jwtToken,
      }
    });


  }
}
