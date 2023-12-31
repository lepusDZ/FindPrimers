import { Component, OnInit, HostListener, ElementRef, ViewChild, AfterViewInit, ChangeDetectionStrategy, Input, ChangeDetectorRef } from '@angular/core';
import { InputService } from '../../services/input.service';
import { RegexService } from '../../services/regex.service';

@Component({
  selector: 'app-plasmid-scroll',
  templateUrl: './plasmid-scroll.component.html',
  styleUrl: './plasmid-scroll.component.scss',
  // changeDetection: ChangeDetectionStrategy.OnPush
})

export class PlasmidScrollComponent implements OnInit, AfterViewInit {
  @ViewChild('scrollElement') scrollElement!: ElementRef;

  outer: string = '';
  inner: string = '';
  reversedPlasmidComplement: string = '';

  @Input() start: number = 0;
  @Input() end: number = 150;

  stringLength: number = 0; // Adjust as needed
  isScrolling: boolean = false;
  scrollInterval: any;
  
  orfs: string[] = [];
  orfsR: string[] = [];

  outerShown: string = '';
  innerShown: string = '';
  
  orfsShown1:string = '';
  orfsShown2: string = '';
  orfsShown3: string = '';

  rOrfsShown1: string = '';
  rOrfsShown2: string = '';
  rOrfsShown3: string = '';

  labels: any[] = [];
  
  speedSettings = [
    { display: 'x1', value: 40 },
    { display: 'x2', value: 25},
    { display: 'x5', value: 10 },
    { display: 'x10', value: 0.2 },

  ];

  mouseSpeedSettings = [1,2,4,8];

  currentSpeedIndex = 0;

  speed: number = this.speedSettings[0].value;
  mouseSpeed: number = this.mouseSpeedSettings[0];

  constructor(private inputService: InputService, private regexService: RegexService, private cdr: ChangeDetectorRef) { };

  ngOnInit(): void {
    // assigns values from input
    this.outer = this.inputService.firstInput;
    this.inner = this.inputService.processedInput;
    this.reversedPlasmidComplement = this.inputService.reversedInput

    // triggers the function inside the regex service to get
    // the enzyme patterns to display
    this.regexService.plasmid = this.outer
    this.regexService.getLowFrequencyPlasmidPatterns(this.outer)

    this.stringLength = this.outer.length

    // show ORFs
    this.orfs = this.regexService.highlightOrfsWithCaseVerbose(this.outer, this.inputService.pORFmin, this.inputService.pORFmax, 0)
    this.orfsR = this.regexService.highlightOrfsWithCaseVerbose(this.reversedPlasmidComplement, this.inputService.pORFmin, this.inputService.pORFmax, 1)
    
    this.updateShownText();
  }


  get currentSpeedDisplay() {
    return this.speedSettings[this.currentSpeedIndex].display;
  }

  changeSpeed() {
    this.currentSpeedIndex = (this.currentSpeedIndex + 1) % this.speedSettings.length;
    this.speed = this.speedSettings[this.currentSpeedIndex].value;

    this.mouseSpeed = this.mouseSpeedSettings[this.currentSpeedIndex]
  }

  
  ngAfterViewInit(): void {
    this.calculateLabelPositions();
  }

  // optimization for labels
  trackByFn(item: any): number {
    return item.id; 
  }

  update() {
    this.cdr.markForCheck()
  }

  // calculates the position of the tspan objects with the highlight class
  // and shows the labels above them
  calculateLabelPositions(): void {
    requestAnimationFrame(() => {
      const textElements = this.scrollElement.nativeElement.querySelectorAll('tspan.highlight');
      this.labels = Array.from(textElements).map((element) => {
        const textElement = element as SVGTextElement; 
        const bbox = textElement.getBBox();
        const enzymeClass = textElement.classList.value.split(' ')[1];
        const id = ((textElement.id == 'red') ? 'red' : 'white');
        // Calculate x, y based on bbox; may need to adjust if it's not positioning correctly
        return {
          id: id,
          x: bbox.x + bbox.width%2+1,
          y: bbox.y - bbox.height, // Position above the tspan
          text: enzymeClass,
          linestartX: bbox.x + bbox.width % 2 + 1,
          linestartY: bbox.y
        };
      });
    });
  }


  updateShownText(): void {
    this.outerShown = this.regexService.highlightPlasmidText(this.sliceString(this.outer));
    this.innerShown = this.sliceString(this.inner)

    this.orfsShown1 = this.sliceString(this.orfs[0])
    this.orfsShown2 = this.sliceString(this.orfs[1])
    this.orfsShown3 = this.sliceString(this.orfs[2])

    this.rOrfsShown1 = this.sliceString(this.orfsR[0])
    this.rOrfsShown2 = this.sliceString(this.orfsR[1])
    this.rOrfsShown3 = this.sliceString(this.orfsR[2])

    this.calculateLabelPositions()
  }

  sliceString(str: string): string {
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
          this.mouseScrollRight();
      } else {
        this.mouseScrollLeft();
      }
    }
  }

// allows scrolling only when over the svg
  @HostListener('mouseover')
  onMouseOver(): void {
    this.isScrolling = true;
  }

  @HostListener('mouseout')
  onMouseOut(): void {
    this.isScrolling = false;
  }

  startScroll(direction: 'left' | 'right'): void {
    this.scrollInterval = setInterval(() => {
      direction === 'left' ? this.scrollLeft() : this.scrollRight();
    }, this.speed); // Adjust interval for speed
  }

  stopScroll(): void {
    if (this.scrollInterval) {
      clearInterval(this.scrollInterval);
      this.scrollInterval = null;
    }
  }

  scrollLeft(): void {
    this.start = (this.start - 1 + this.stringLength) % this.stringLength;
    this.end = (this.end - 1 + this.stringLength) % this.stringLength;

    // Update the displayed text
    this.updateShownText();
  }

  scrollRight(): void {
    this.start = (this.start + 1) % this.stringLength;
    this.end = (this.end + 1) % this.stringLength;

    // Update the displayed text
    this.updateShownText();
  }

  mouseScrollLeft(): void {
    this.start = (this.start - this.mouseSpeed + this.stringLength) % this.stringLength;
    this.end = (this.end - this.mouseSpeed + this.stringLength) % this.stringLength;

    // Update the displayed text
    this.updateShownText();
  }

  mouseScrollRight(): void {
    this.start = (this.start + this.mouseSpeed) % this.stringLength;
    this.end = (this.end + this.mouseSpeed) % this.stringLength;

    // Update the displayed text
    this.updateShownText();
  }
}
