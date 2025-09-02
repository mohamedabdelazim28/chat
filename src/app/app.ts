import { Component } from '@angular/core';
import { SidebarComponent } from './sidebar/sidebar';
import { ChatListComponent } from './chat-list/chat-list';
import { Navbar } from './navbar/navbar';
import { CommonModule } from '@angular/common';
import { ChatWindowcomponent } from './chat-window/chat-window';

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
export class AppComponent {}
