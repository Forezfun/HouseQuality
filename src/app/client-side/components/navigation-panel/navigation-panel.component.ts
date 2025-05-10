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
  protected menuOpen = false;
  protected isMobileView = false;

  ngOnInit() {
    this.checkViewport();
  }

  @HostListener('window:resize', ['$event'])
  private checkViewport() {
    this.isMobileView = window.innerWidth <= 750;
    if (!this.isMobileView) {
      this.menuOpen = false;
    }
  }
  protected toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }
}
