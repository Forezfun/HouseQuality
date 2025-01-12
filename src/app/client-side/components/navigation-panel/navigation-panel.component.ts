import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FinderComponent } from '../finder/finder.component';
@Component({
  selector: 'app-navigation-panel',
  standalone: true,
  imports: [RouterLink,FinderComponent],
  templateUrl: './navigation-panel.component.html',
  styleUrl: './navigation-panel.component.scss'
})
export class NavigationPanelComponent {}
