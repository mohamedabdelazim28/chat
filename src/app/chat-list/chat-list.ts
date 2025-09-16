import { Component, OnInit, ChangeDetectorRef, inject, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, ChatThread } from '../services/chat-service';
import { EventEmitter } from '@angular/core';

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
  selectedChat : any = null;

   @Input() selectedChatId: string | null = null;
  @Output() chatSelected = new EventEmitter<string>();


  onChatClick(chatId: string) {
    this.chatSelected.emit(chatId);
  }


  onSelectChat(chatId: string) {
    console.log('Chat clicked:', chatId);
    this.chatSelected.emit(chatId);
  }

  private chatService = inject(ChatService);
  constructor(private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.loadConversations();
  }

  loadConversations(loadMore: boolean = false): void {
    if (this.isLoading) return;
    this.isLoading = true;
    this.chatService.getusermessage(this.limit, this.page)
   .subscribe({
        next:  ( { data , totalCount }) => {
          if (loadMore) {
            this.chats = [...this.chats, ...data];
          } else {
            this.chats = data;
          }

          this.totalRecords = totalCount;

          this.displayedChats = this.filterChats(this.chats);
          this.cdr.detectChanges();

          this.isLoading = false;
          console.log(data , totalCount);
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

  getusermessage() {

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
      filtered = filtered.filter((c) => c.numberOfUnread > 0);
    } else if (this.activeFilter === 'groups') {
      filtered = filtered.filter((c: any) => c.isGroup);
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.firstName?.toLowerCase().includes(term) ||
          c.message?.toLowerCase().includes(term) ||
          c.lastName?.toLowerCase().includes(term)
      );
    }

    return filtered;
  }

  selectChat(userId: number): void {
    console.log(userId)
    this.chatService.setSelectedUser(userId);
     this.chatSelected.emit(userId.toString());
  }


}
