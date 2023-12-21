import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { InputService } from '../../services/input.service';

@Component({
  selector: 'app-plasmid',
  templateUrl: './plasmid.component.html',
  styleUrls: ['./plasmid.component.scss'],
})
export class PlasmidComponent implements OnInit, OnDestroy {
  inputFromService: string = '';
  processedInput: string = '';
  private subscription: Subscription = new Subscription();

  constructor(private inputService: InputService) { }

  ngOnInit(): void {
    this.subscription.add(this.inputService.input$.subscribe(value => {
      this.inputFromService = value.slice(0, 500);
    }));

    this.subscription.add(this.inputService.processed$.subscribe(value => {
      this.processedInput = value.slice(0, 500);
    }));
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
