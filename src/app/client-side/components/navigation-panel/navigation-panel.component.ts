import { Component, HostListener, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FinderComponent } from '../finder/finder.component';
import { NgIf } from '@angular/common';
@Component({
  selector: 'app-navigation-panel',
  standalone: true,
  imports: [RouterLink,FinderComponent,NgIf],
  templateUrl: './navigation-panel.component.html',
  styleUrl: './navigation-panel.component.scss'
})
export class NavigationPanelComponent implements OnInit {
  menuOpen = false;
  isMobileView = false;

  ngOnInit() {
    this.checkViewport();
  }
  @HostListener('window:resize', ['$event'])
  checkViewport() {
    this.isMobileView = window.innerWidth <= 600;
    if (!this.isMobileView) {
      this.menuOpen = false;
    }
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }
}
