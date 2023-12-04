import { Component, OnInit, ViewChild } from '@angular/core';
import { PlasmidScrollComponent } from './plasmid-scroll/plasmid-scroll.component';

@Component({
  selector: 'app-scroll',
  templateUrl: './scroll.component.html',
  styleUrls: ['./scroll.component.scss'],
})
export class ScrollComponent implements OnInit {
  blurred = true;

  @ViewChild(PlasmidScrollComponent) plasmid! : PlasmidScrollComponent;

  changePosition(value:number) {
    if (value > 150) {
      this.plasmid.start = value - 45;
      this.plasmid.end = value + 75;
      this.plasmid.updateShownText()
      this.plasmid.calculateLabelPositions()
      this.plasmid.update()
    }
  }

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
