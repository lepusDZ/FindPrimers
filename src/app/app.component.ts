import { Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  backgroundClass = 'background-default';

  constructor(private router: Router) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        if (event.url.includes('/scroll')) {
          this.backgroundClass = 'background-scroll';
        } else {
          this.backgroundClass = 'background-default';
        }
      }
    });
  }
}
