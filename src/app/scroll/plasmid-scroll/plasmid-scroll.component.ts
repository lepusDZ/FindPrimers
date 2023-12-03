import { Component, OnInit, HostListener, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { InputService } from '../../services/input.service';
import { RegexService } from '../../services/regex.service';

@Component({
  selector: 'app-plasmid-scroll',
  templateUrl: './plasmid-scroll.component.html',
  styleUrl: './plasmid-scroll.component.scss',
})

export class PlasmidScrollComponent implements OnInit, AfterViewInit {
  @ViewChild('scrollElement') scrollElement!: ElementRef;

  outer: string = '';
  inner: string = '';

  start: number = 0;
  end: number = 200;

  stringLength: number = 0; // Adjust as needed
  isScrolling: boolean = false;
  scrollInterval: any;
  
  orfs: string[] = [];

  outerShown: string = '';
  innerShown: string = '';
  
  orfsShown1:string = '';
  orfsShown2: string = '';
  orfsShown3: string = '';

  labels: any[] = [];

  constructor(private inputService: InputService, private regexService: RegexService) { };

  ngOnInit(): void {
    this.outer = this.inputService.firstInput;
    this.regexService.plasmid = this.outer
    this.regexService.getLowFrequencyPlasmidPatterns(this.outer)
    this.inner = this.inputService.processedInput;
    this.stringLength = this.outer.length
    this.orfs = this.regexService.highlightOrfsWithCaseVerbose(this.outer, 0, 2500)
    console.log(this.outer.length,this.inner.length,this.orfs.length)
    console.log(this.orfs)
    this.updateShownText();
  }
  
  ngAfterViewInit(): void {
    this.calculateLabelPositions();
  }

  calculateLabelPositions(): void {
    setTimeout(() => {
      const textElements = this.scrollElement.nativeElement.querySelectorAll('tspan.highlight');
      this.labels = Array.from(textElements).map((element) => {
        const textElement = element as SVGTextElement; 
        const bbox = textElement.getBBox();
        const enzymeClass = textElement.classList.value.split(' ')[1];
        // Calculate x, y based on bbox; may need to adjust if it's not positioning correctly
        return {
          x: bbox.x + bbox.width%2+1,
          y: bbox.y - bbox.height, // Position above the tspan
          text: enzymeClass,
          linestartX: bbox.x + bbox.width % 2 + 1,
          linestartY: bbox.y
        };
      });
    }, 0); // setTimeout with 0 to wait for the next tick when DOM is updated
  }


  updateShownText(): void {
    this.outerShown = this.regexService.highlightPlasmidText(this.sliceString(this.outer));
    this.innerShown = this.sliceString(this.inner)
    this.orfsShown1 = this.sliceString(this.orfs[0])
    this.orfsShown2 = this.sliceString(this.orfs[1])
    this.orfsShown3 = this.sliceString(this.orfs[2])
    this.calculateLabelPositions()
  }

  sliceString(str: string): string {
    console.log('end', this.end, 'start', this.start)
    console.log(this.orfsShown1)
    if (this.end > this.start) {
      return str.slice(this.start, this.end);
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
