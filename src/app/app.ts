import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { SidebarComponent } from './sidebar/sidebar';
import { ChatListComponent } from './chat-list/chat-list';
import { ChatWindowcomponent } from './chat-window/chat-window';
import { Navbar } from './navbar/navbar';

@Component({
    selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    SidebarComponent,
    ChatListComponent,
    ChatWindowcomponent,
    Navbar
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  isSidebarOpen = false;
  isChatListOpen = false;
  isMobile = false;
  isTablet = false;
  isChatWindowOpen = false;
  selectedChatId: string | null = null;

  constructor() {}

  ngOnInit() {
    this.checkScreenSize();
  }

  ngOnDestroy() {

  }

  @HostListener('window:resize', ['$event'])
    onResize(event: any) {
    this.checkScreenSize();

    if (!this.isMobile && !this.isTablet) {
      this.isSidebarOpen = false;
      this.isChatListOpen = false;
      this.isChatWindowOpen = false;
    }
  }

  private checkScreenSize() {
    const width = window.innerWidth;
    this.isMobile = width <= 767;
    this.isTablet = width > 767 && width <= 1023;
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;

    if (this.isMobile && this.isSidebarOpen) {
      this.isChatListOpen = false;
    }
  }

  toggleChatList() {
    this.isChatListOpen = !this.isChatListOpen;

    if (this.isMobile && this.isChatListOpen) {
      this.isSidebarOpen = false;
    }
  }

  closeSidebar() {
    this.isSidebarOpen = false;
  }

  closeChatList() {
    this.isChatListOpen = false;
  }

  onChatSelected(chatId: string) {
      console.log('onChatSelected', { chatId, isMobile: this.isMobile });
    this.selectedChatId = chatId;

    if (this.isMobile) {
      this.isChatWindowOpen = true;
          this.isChatListOpen = false;
    }
  }

  goBackToChatList() {
    if (this.isMobile) {
      this.isChatListOpen = false;
      this.isChatWindowOpen = true;
      this.selectedChatId = null;
    }
  }

  onOverlayClick() {
    this.isSidebarOpen = false;
    if (!this.isMobile){
    this.isChatListOpen = false;
    }
  }

  @HostListener('keydown.escape', ['$event'])
  onEscapeKey(event: any) {
    this.isSidebarOpen = false;
    this.isChatListOpen = false;

    if (this.isMobile && this.isChatWindowOpen) {
      this.goBackToChatList();
    }
  }

  getContainerClasses() {
    return {
      'sidebar-open': this.isSidebarOpen,
      'chat-list-open': this.isChatListOpen,
      'is-mobile': this.isMobile,
      'is-tablet': this.isTablet,
      'chat-window-open': this.isChatWindowOpen
    };
  }
}
