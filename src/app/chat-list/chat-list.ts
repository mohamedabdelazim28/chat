import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../services/chat-service';
import { map, Observable } from 'rxjs';

interface ChatPreview {
  userId: number;
  name: string;
  photo: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  totalCount: number; // 👈 جديد
}

@Component({
  selector: 'app-chat-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-list.component.html',
  styleUrls: ['./chat-list.component.scss']
})
export class ChatListComponent implements OnInit {
  private chatService = inject(ChatService);

  conversations$!: Observable<ChatPreview[]>;

  activeFilter: string = 'all';
  searchTerm: string = '';

  ngOnInit() {
    this.conversations$ = this.chatService.getusermessage(10, 1).pipe(
      map((res: any) => {
        const grouped = new Map<number, ChatPreview>();

        res.data.forEach((msg: any) => {
          const userId = msg.fromUser.id;

          if (!grouped.has(userId)) {
            grouped.set(userId, {
              userId,
              name: `${msg.fromUser.firstName} ${msg.fromUser.lastName}`,
              photo: msg.fromUser.photo,
              lastMessage: msg.body,
              lastMessageTime: new Date(msg.createdOn),
              unreadCount: msg.isReaded ? 0 : 1,
              totalCount: 1
            });
          } else {
            const existing = grouped.get(userId)!;


            if (new Date(msg.createdOn) > existing.lastMessageTime) {
              existing.lastMessage = msg.body;
              existing.lastMessageTime = new Date(msg.createdOn);
            }


            if (!msg.isReaded) {
              existing.unreadCount += 1;
            }


            existing.totalCount += 1;
          }
        });

        return Array.from(grouped.values());
      })
    );
  }

  setFilter(filter: string) {
    this.activeFilter = filter;
  }


  filterChats(chats: ChatPreview[]): ChatPreview[] {
    let filtered = chats;

    if (this.activeFilter === 'unread') {
      filtered = filtered.filter(c => c.unreadCount > 0);
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(term) ||
        c.lastMessage.toLowerCase().includes(term)
      );
    }

    return filtered;
  }
}
