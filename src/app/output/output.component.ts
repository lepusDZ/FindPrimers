import { Component, OnDestroy, OnInit } from '@angular/core';
import { ButtonService } from '../services/button.service';
import { Subscription } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-output',
  templateUrl: './output.component.html',
  styleUrl: './output.component.scss'
})
export class OutputComponent implements OnInit, OnDestroy {
    private subscription: Subscription = new Subscription();
    forwardPrimer: string = '';
    reversePrimer: string = '';

    constructor(private buttonService: ButtonService, private _snackBar: MatSnackBar) {}

    ngOnInit(): void {
      this.subscription.add(
        this.buttonService.output.subscribe((output: string[]) => {
          this.forwardPrimer = output[0];
          this.reversePrimer = output[1];
        })
      );
    }


    openSnackBar() {
      this._snackBar.open('Copied to the clipboard', '', {
        duration: 3000
});
    }

    ngOnDestroy(): void {
      this.subscription.unsubscribe();
    }
}
