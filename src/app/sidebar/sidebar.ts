import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [MatIconModule , CommonModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss']
})
export class SidebarComponent {
  menuItems = [
    { icon: 'people', label: 'Community', active: false },
    { icon: 'book', label: 'Resources', active: false },
    { icon: 'school', label: 'Education', active: false },
    { icon: 'shield', label: 'Anti-Bullying', active: false }
  ];

  currentUser = {
    name: 'Michael Smith',
    avatar: 'assets/imges/Avatar.png'
  };

  onMenuItemClick(index: number): void {
    this.menuItems.forEach((item, i) => {
      item.active = i === index;
    });
  }
}
