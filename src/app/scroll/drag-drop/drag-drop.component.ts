import { Component } from '@angular/core';
import { ButtonService } from '../../services/button.service'; // Adjust the path as necessary
import { Subscription } from 'rxjs';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-drag-drop',
  templateUrl: './drag-drop.component.html',
  styleUrls: ['./drag-drop.component.scss']
})
export class DragDropComponent {
  private subscription: Subscription = new Subscription();
  ORFbuttons: string[] = [];
  RSbuttons: string[] = [];

  constructor(protected buttonService: ButtonService) { }

  ngOnInit() {
    this.subscription.add(
      this.buttonService.droppedORF.subscribe((buttons: string[]) => {
        this.ORFbuttons = buttons;
      })
    );
    this.subscription.add(
      this.buttonService.droppedRS.subscribe((buttons: string[]) => {
        this.RSbuttons = buttons;
      })
    );
  }

  drop(event: CdkDragDrop<string[]>) {
    if (event.container.id === event.previousContainer.id) {
      if (event.container.id === "ORF-drop") {
        moveItemInArray(this.ORFbuttons, event.previousIndex, event.currentIndex);
      } else {
        moveItemInArray(this.RSbuttons, event.previousIndex, event.currentIndex);
      }
    } else {
      if (event.container.id === "ORF-drop" && event.previousContainer.id === "ORF-drag") {
        this.buttonService.moveORFToDropped(event.previousIndex);
      } else if (event.container.id === "RS-drop" && event.previousContainer.id === "RS-drag") {
        this.buttonService.moveRSToDropped(event.previousIndex);
      }
    }
  }


  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
  }