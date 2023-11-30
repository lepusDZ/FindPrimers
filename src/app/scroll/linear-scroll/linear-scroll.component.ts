import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { InputService } from '../../services/input.service';


@Component({
  selector: 'app-linear-scroll',
  templateUrl: './linear-scroll.component.html',
  styleUrl: './linear-scroll.component.scss'
})
export class LinearScrollComponent {
  @ViewChild('scrollElement') scrollElement!: ElementRef;

  outer: string = '';
  inner: string = '';

  start: number = 0;
  end: number = 47; // Initially display first 50 characters

  stringLength: number = 600; // Default string length

  isScrolling: boolean = false;
  scrollInterval: any;

  outerShown: string = '';
  innerShown: string = '';

  constructor(private inputService: InputService) { };

  ngOnInit(): void {
    this.outer = this.inputService.secondInput;
    this.inner = this.inputService.processedSecond;
    this.stringLength = this.outer.length; // Update stringLength based on actual string length
    this.updateShownText();
  }

  updateShownText(): void {
    this.outerShown = this.sliceString(this.outer);
    this.innerShown = this.sliceString(this.inner);
  }

  sliceString(str: string): string {
    return str.slice(this.start, Math.min(this.start + 47, this.stringLength));
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
    if (this.start > 0) {
      this.start--;
      this.end = Math.min(this.start + 50, this.stringLength);
      this.updateShownText();
    }
  }

  scrollRight(): void {
    if (this.end < this.stringLength) {
      this.start++;
      this.end = Math.min(this.start + 50, this.stringLength);
      this.updateShownText();
    }
  }
}
