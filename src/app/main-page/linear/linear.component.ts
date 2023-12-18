import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription, debounceTime } from 'rxjs';
import { InputService } from '../../services/input.service';

@Component({
  selector: 'app-linear',
  templateUrl: './linear.component.html',
  styleUrl: './linear.component.scss'
})
export class LinearComponent implements OnInit, OnDestroy {
  inputFromService: string = '';
  processed: string = '';
  private subscription: Subscription = new Subscription();

  constructor(private inputService: InputService) { }

  ngOnInit(): void {
    this.subscription.add(this.inputService.secondInput$.pipe(
      debounceTime(0)
    ).subscribe(value => {
      this.inputFromService = value.slice(0, 100);
    }));

    this.subscription.add(this.inputService.secondProcessed$.pipe(
      debounceTime(0)
    ).subscribe(value => {
      this.processed = value.slice(0, 100);
    }));
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

}
