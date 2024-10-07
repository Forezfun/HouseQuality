import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-navigation-panel',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './navigation-panel.component.html',
  styleUrl: './navigation-panel.component.scss'
})
export class NavigationPanelComponent {}
