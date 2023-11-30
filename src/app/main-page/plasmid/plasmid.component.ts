import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription, debounceTime } from 'rxjs';
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
    this.subscription.add(this.inputService.input$.pipe(
      debounceTime(0)
    ).subscribe(value => {
      this.inputFromService = value.slice(0, 139);
      if (value.length > 139) {
        this.inputFromService += '.......';
      }
    }));

    this.subscription.add(this.inputService.processed$.pipe(
      debounceTime(0)
    ).subscribe(value => {
      this.processedInput = value.slice(0, 139);
      if (value.length > 139) {
        this.processedInput += '.......';
      }
    }));
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
