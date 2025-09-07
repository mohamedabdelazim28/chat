import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, ChatThread } from '../services/chat-service';
import { map } from 'rxjs';

@Component({
  selector: 'app-chat-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-list.component.html',
  styleUrls: ['./chat-list.component.scss']
})
export class ChatListComponent implements OnInit {
  chats: ChatThread[] = [];
  displayedChats: ChatThread[] = [];
  totalRecords = 0;
  limit = 100;
  page = 1;
  isLoading = false;

  activeFilter: string = 'all';
  searchTerm: string = '';


  // messages: ChatThread[] = [
  //   {
  //     lastMessage: 'test message 1',
  //     body: 'test message 1',
  //     messages: [],
  //     lastMessageTime: new Date('2025-08-25T15:42:01Z'),
  //     name: 'User 1',
  //     photo: 'https://dwr9zlq9lexeu.cloudfront.net/Development/UserProfile/117231a5-ae76-44cd-bc17-d5b4d68249e7.avif',
  //     totalCount: 1,
  //     unreadCount: 1,
  //     userId: 601
  //   },
  //   {
  //     lastMessage: 'test message 2',
  //     body: 'test message 2',
  //     messages: [],
  //     lastMessageTime: new Date('2025-08-25T15:42:02Z'),
  //     name: 'User 2',
  //     photo: 'https://dwr9zlq9lexeu.cloudfront.net/Development/UserProfile/117231a5-ae76-44cd-bc17-d5b4d68249e7.avif',
  //     totalCount: 2,
  //     unreadCount: 0,
  //     userId: 602
  //   },
  //   {
  //     lastMessage: 'test message 3',
  //     body: 'test message 3',
  //     messages: [],
  //     lastMessageTime: new Date('2025-08-25T15:42:03Z'),
  //     name: 'User 3',
  //     photo: 'https://dwr9zlq9lexeu.cloudfront.net/Development/UserProfile/117231a5-ae76-44cd-bc17-d5b4d68249e7.avif',
  //     totalCount: 3,
  //     unreadCount: 5,
  //     userId: 603
  //   },
  //   {
  //     lastMessage: 'test message 4',
  //     body: 'test message 4',
  //     messages: [],
  //     lastMessageTime: new Date('2025-08-25T15:42:04Z'),
  //     name: 'User 4',
  //     photo: 'https://dwr9zlq9lexeu.cloudfront.net/Development/UserProfile/117231a5-ae76-44cd-bc17-d5b4d68249e7.avif',
  //     totalCount: 4,
  //     unreadCount: 1,
  //     userId: 604
  //   },
  //   {
  //     lastMessage: 'test message 5',
  //     body: 'test message 5',
  //     messages: [],
  //     lastMessageTime: new Date('2025-08-25T15:42:05Z'),
  //     name: 'User 5',
  //     photo: 'https://dwr9zlq9lexeu.cloudfront.net/Development/UserProfile/117231a5-ae76-44cd-bc17-d5b4d68249e7.avif',
  //     totalCount: 5,
  //     unreadCount: 0,
  //     userId: 605
  //   },
  //   {
  //     lastMessage: 'test message 6',
  //     body: 'test message 6',
  //     messages: [],
  //     lastMessageTime: new Date('2025-08-25T15:42:06Z'),
  //     name: 'User 6',
  //     photo: 'https://dwr9zlq9lexeu.cloudfront.net/Development/UserProfile/117231a5-ae76-44cd-bc17-d5b4d68249e7.avif',
  //     totalCount: 6,
  //     unreadCount: 1,
  //     userId: 606
  //   }
  // ];

  private chatService = inject(ChatService);
  constructor(private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.loadConversations();
  }

  loadConversations(loadMore: boolean = false): void {
    if (this.isLoading) return;
    this.isLoading = true;

    this.chatService
      .getusermessage(this.limit, this.page)
      .pipe(
        map((res: any) => {
          this.isLoading = false;
          const grouped = new Map<number, ChatThread>();


          (res?.data ?? []).forEach((msg: any) => {
            const userId = msg.user.id;
            if (!grouped.has(userId)) {
              grouped.set(userId, {
                userId,
                name: `${msg.user.firstName} ${msg.user.lastName}`,
                photo: msg.fromUser.photo,
                body: msg.body,
                lastMessage: msg.body,
                messages: [msg],
                lastMessageTime: new Date(msg.createdOn),
                unreadCount: msg.isReaded ? 0 : 1,
                totalCount: 1
              });
            } else {
              const existing = grouped.get(userId)!;

              existing["unreadCount"] += msg.isReaded ? 0 : 1;
              existing["totalCount"] += 1;
              existing["messages"].push(msg);

              grouped.set(userId, existing);

              if (new Date(msg.createdOn) > existing.lastMessageTime) {
                existing.lastMessage = msg.body;
                existing.lastMessageTime = new Date(msg.createdOn);
              }
              if (!msg.isReaded) existing.unreadCount += 1;
              existing.totalCount += 1;
            }
          });

          const apiChats = Array.from(grouped.values());

          this.chatService.setMessages([...apiChats]); //, ...this.messages

          return [...apiChats];

        })
      )
      .subscribe({
        next: (currentPageData: ChatThread[]) => {
          if (loadMore) {
            this.chats = [...this.chats, ...currentPageData];
          } else {
            this.chats = currentPageData;
          }

          this.totalRecords = this.chats.length;

          this.displayedChats = this.filterChats(this.chats);
          this.cdr.detectChanges();

          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading conversations:', err);
          if (!this.chats.length) {
            // this.chats = [...this.messages];
            this.displayedChats = this.filterChats(this.chats);
            this.cdr.detectChanges();
          }
          this.isLoading = false;
        }
      });
  }

  loadNextPage(): void {
    this.page++;
    this.loadConversations(true);
  }

  onScroll(event: Event): void {
    const target = event.target as HTMLElement;
    if (target.scrollTop + target.clientHeight >= target.scrollHeight - 50) {
      if (!this.isLoading) this.loadNextPage();
    }
  }

  setFilter(filter: string): void {
    this.activeFilter = filter;
    this.displayedChats = this.filterChats(this.chats);
  }

  filterChats(chats: ChatThread[]): ChatThread[] {
    let filtered = [...chats];

    if (this.activeFilter === 'unread') {
      filtered = filtered.filter((c) => c.unreadCount > 0);
    } else if (this.activeFilter === 'groups') {
      filtered = filtered.filter((c: any) => c.isGroup);
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name?.toLowerCase().includes(term) ||
          c.lastMessage?.toLowerCase().includes(term)
      );
    }

    return filtered;
  }

  selectChat(userId: number): void {
    console.log(userId)
    this.chatService.setSelectedUser(userId);
  }
}
