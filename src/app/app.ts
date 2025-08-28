import { Component } from '@angular/core';
import { SidebarComponent } from './sidebar/sidebar';
import { ChatListComponent } from './chat-list/chat-list';
import { ChatWindow } from './chat-window/chat-window';
import { Navbar } from './navbar/navbar';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    SidebarComponent,
    ChatListComponent,
    ChatWindow,
    Navbar
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class AppComponent {}
