import { Component, OnDestroy, OnInit } from '@angular/core';
import { ButtonService } from '../../services/button.service';
import { Subscription } from 'rxjs';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-buttons',
  templateUrl: './buttons.component.html',
  styleUrls: ['./buttons.component.scss']
})
export class ButtonsComponent implements OnInit, OnDestroy {
  private subscription: Subscription = new Subscription();
  ORFbuttons: string[] = []; 
  RSbuttons: string[] = []; 

  constructor(protected buttonService: ButtonService) { }

  ngOnInit() {
    this.subscription.add(
      this.buttonService.ORFbuttons.subscribe((buttons: string[]) => { 
        this.ORFbuttons = buttons;
      })
    );
    this.subscription.add(
      this.buttonService.RSbuttons.subscribe((buttons: string[]) => { 
        this.RSbuttons = buttons;
      })
    );
  }

  drop(event: CdkDragDrop<string[]>) {
    if (event.container.id === event.previousContainer.id) {
      if (event.container.id === "ORF-drag") {
        moveItemInArray(this.ORFbuttons, event.previousIndex, event.currentIndex);
      } else {
        moveItemInArray(this.RSbuttons, event.previousIndex, event.currentIndex);
      }
    } else {
      if (event.container.id === "ORF-drag" && event.previousContainer.id === "ORF-drop") {
        this.buttonService.moveDroppedToORF(event.previousIndex);
      } else if (event.container.id === "RS-drag" && event.previousContainer.id === "RS-drop") {
        this.buttonService.moveDroppedToRS(event.previousIndex);
      }
    }
  }


  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
