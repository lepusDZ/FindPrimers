import { Component } from '@angular/core';
import { ButtonService } from '../../services/button.service'; // Adjust the path as necessary
import { Subscription } from 'rxjs';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Router } from '@angular/router';

@Component({
  selector: 'app-drag-drop',
  templateUrl: './drag-drop.component.html',
  styleUrls: ['./drag-drop.component.scss']
})
export class DragDropComponent {
  private subscription: Subscription = new Subscription();
  ORFbuttons: string[] = [];
  RSbuttons: string[] = [];

  constructor(protected buttonService: ButtonService, private router: Router) { }

  // dynamically displays the buttons
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
    // if moved in the same container change the index
    if (event.container.id === event.previousContainer.id) {
      if (event.container.id === "ORF-drop") {
        moveItemInArray(this.ORFbuttons, event.previousIndex, event.currentIndex);
      } else {
        moveItemInArray(this.RSbuttons, event.previousIndex, event.currentIndex);
      }
    } else {
      // moves the button to the list accordingly to the area where it was dropped
      // orf-drop is rs1 drop and rs is rs2 drop
      if (event.container.id === "ORF-drop" && event.previousContainer.id === "RS-drag") {
        this.buttonService.copyORFToDropped(event.previousIndex);
      } else if (event.container.id === "RS-drop" && event.previousContainer.id === "RS-drag") {
        this.buttonService.copyRSToDropped(event.previousIndex);
      }
    }
  }


  onSubmit(){
    this.buttonService.calculateOutput(this.ORFbuttons[0], this.RSbuttons[0])
    this.router.navigate(['/output'])
  }


  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
  }