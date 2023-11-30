import { Component, OnInit, HostListener, ElementRef, ViewChild } from '@angular/core';
import { InputService } from '../../services/input.service';

@Component({
  selector: 'app-plasmid-scroll',
  templateUrl: './plasmid-scroll.component.html',
  styleUrl: './plasmid-scroll.component.scss'
})
export class PlasmidScrollComponent implements OnInit {
  @ViewChild('scrollElement') scrollElement!: ElementRef;

  outer: string = '';
  inner: string = '';
  start: number = 0;
  end: number = 136;
  stringLength: number = 0; // Adjust as needed
  isScrolling: boolean = false;
  scrollInterval: any;

  outerShown: string = '';
  innerShown: string = '';

  constructor(private inputService: InputService) { };

  ngOnInit(): void {
    this.outer = this.inputService.firstInput;
    this.inner = this.inputService.processedInput;
    this.stringLength = this.outer.length
    this.updateShownText();
  }

  updateShownText(): void {
    this.outerShown = this.sliceString(this.outer);
    this.innerShown = this.sliceString(this.inner);
  }

  sliceString(str: string): string {
    if (this.end > this.start) {
      return str.slice(this.start, this.stringLength) + str.slice(0, this.end - this.stringLength);
    } else {
      // When end is less than start, wrap around the string
      return str.slice(this.start) + str.slice(0, this.end);
    }
  }

  @HostListener('wheel', ['$event'])
  onScroll(event: WheelEvent): void {
    if (this.isScrolling && this.scrollElement.nativeElement.contains(event.target)) {
      event.preventDefault();
      if (event.deltaY > 0) {
        this.scrollRight();
      } else {
        this.scrollLeft();
      }
    }
  }

  @HostListener('mouseover')
  onMouseOver(): void {
    this.isScrolling = true;
  }

  @HostListener('mouseout')
  onMouseOut(): void {
    this.isScrolling = false;
  }

  startScroll(direction: 'left' | 'right'): void {
    this.stopScroll();
    this.scrollInterval = setInterval(() => {
      direction === 'left' ? this.scrollLeft() : this.scrollRight();
    }, 100); // Adjust interval for speed
  }

  stopScroll(): void {
    if (this.scrollInterval) {
      clearInterval(this.scrollInterval);
      this.scrollInterval = null;
    }
  }

  scrollLeft(): void {
    // When scrolling left, decrement start and end
    this.start = (this.start - 1 + this.stringLength) % this.stringLength;
    this.end = (this.end - 1 + this.stringLength) % this.stringLength;

    // Update the displayed text
    this.updateShownText();
  }

  scrollRight(): void {
    // When scrolling right, increment start and end
    this.start = (this.start + 1) % this.stringLength;
    this.end = (this.end + 1) % this.stringLength;

    // Update the displayed text
    this.updateShownText();
  }
}
