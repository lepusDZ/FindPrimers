import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
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
  
  @Output() position = new EventEmitter<number>()

  constructor(protected buttonService: ButtonService) { }

  ngOnInit() {
    this.subscription.add(
      this.buttonService.RSbuttons.subscribe((buttons: string[]) => { 
        this.RSbuttons = buttons;
      })
    );
  }

  drop(event: CdkDragDrop<string[]>) {
    if (event.container.id === event.previousContainer.id) {  
        moveItemInArray(this.RSbuttons, event.previousIndex, event.currentIndex);
    } else {
      // allows the buttons to be moved back
      if (event.container.id === "RS-drag" && event.previousContainer.id === "ORF-drop") {
        this.buttonService.moveDroppedToORF(event.previousIndex);
      } else if (event.container.id === "RS-drag" && event.previousContainer.id === "RS-drop") {
        this.buttonService.moveDroppedToRS(event.previousIndex);
      }
    }
  }

  // on click moves the button back
  onClickRS(element:string) {
    this.position.emit(this.buttonService.RSpositions[element])
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
