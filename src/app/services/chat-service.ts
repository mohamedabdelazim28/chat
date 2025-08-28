import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  private http = inject(HttpClient);
  private baseURL= 'https://devbe.ariseorganization.com'
  private jwtToken ='Bearer eyJhbGciOiJodHRwOi8vd3d3LnczLm9yZy8yMDAxLzA0L3htbGRzaWctbW9yZSNobWFjLXNoYTI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoiTW9oYW1lZCBBYmRlbEF6aW0iLCJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjY5NCIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL2VtYWlsYWRkcmVzcyI6Im1vaGFtZWRhYmRlbGF6aW0yODRAZ21haWwuY29tIiwidWlkIjoiNjk0IiwiaHR0cDovL3NjaGVtYXMubWljcm9zb2Z0LmNvbS93cy8yMDA4LzA2L2lkZW50aXR5L2NsYWltcy9yb2xlIjoiR3Vlc3QiLCJHZXRBbGxOYXRpb25hbGl0aWVzIjoidHJ1ZSIsImV4cCI6MTc4NzY4MTI4MywiaXNzIjoiSWRlbnRpdHkiLCJhdWQiOiJJZGVudGl0eVVzZXIifQ.5EfbgAiM-77FlWecX3YB5yyVTMohKkgyckUU0e4FVL0';


  conversations: any[] = [];
  getusermessage(pageSize: number, pageNumber: number){

  return this.http.get<{data:any[]}>(`${this.baseURL}/api/Message/GetUserChatMessages`,{
    headers: {
    'Authorization': this.jwtToken,
  },

   params: {WithUserId: '694', PageSize: pageSize , PageNumber: pageNumber},

  })


  }
}
