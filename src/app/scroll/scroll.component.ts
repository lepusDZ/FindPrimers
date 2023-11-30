import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-scroll',
  templateUrl: './scroll.component.html',
  styleUrls: ['./scroll.component.scss']
})
export class ScrollComponent implements OnInit {
  blurred = true;

  onClick() {
    this.blurred = false;
    localStorage.setItem('blurred', 'false'); // Store the value as a string
  }

  ngOnInit(): void {
    // Check if 'blurred' value is stored in localStorage
    const storedBlurred = localStorage.getItem('blurred');
    if (storedBlurred !== null) {
      this.blurred = storedBlurred === 'true'; // Convert the string back to a boolean
    } else {
      this.blurred = true; // Default value if nothing is stored
    }
  }
}
