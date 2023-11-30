import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ButtonService {
    private ORFsubject = new BehaviorSubject<string[]>(['ORF1', 'ORF2', 'ORF3']);
    private RSsubject = new BehaviorSubject<string[]>(['EcoRl', 'XhoI', 'MhoL']);
    private droppedORFsubject = new BehaviorSubject<string[]>([]);
    private droppedRSsubject = new BehaviorSubject<string[]>([]);


    ORFbuttons = this.ORFsubject.asObservable();
    RSbuttons = this.RSsubject.asObservable();

    droppedORF = this.droppedORFsubject.asObservable();
    droppedRS = this.droppedRSsubject.asObservable();

    moveORFToDropped(index: number) {
        const currentORFButtons = this.ORFsubject.value;
        const currentDroppedORF = this.droppedORFsubject.value;

        if (index >= 0 && index < currentORFButtons.length) {
            const movedORF = currentORFButtons.splice(index, 1)[0];

            // If there's a value in the dropped list, move it back to ORFbuttons
            if (currentDroppedORF.length > 0) {
                const prevDroppedORF = currentDroppedORF.splice(0, 1)[0];
                currentORFButtons.push(prevDroppedORF);
            }

            currentDroppedORF.push(movedORF);

            this.ORFsubject.next(currentORFButtons);
            this.droppedORFsubject.next(currentDroppedORF);
        }
    }

    moveRSToDropped(index: number) {
        const currentRSButtons = this.RSsubject.value;
        const currentDroppedRS = this.droppedRSsubject.value;

        if (index >= 0 && index < currentRSButtons.length) {
            const movedRS = currentRSButtons.splice(index, 1)[0];

            // If there's a value in the dropped list, move it back to RSbuttons
            if (currentDroppedRS.length > 0) {
                const prevDroppedRS = currentDroppedRS.splice(0, 1)[0];
                currentRSButtons.push(prevDroppedRS);
            }

            currentDroppedRS.push(movedRS);

            this.RSsubject.next(currentRSButtons);
            this.droppedRSsubject.next(currentDroppedRS);
        }
    }

    
    moveDroppedToORF(index: number) {
  const currentORFButtons = this.ORFsubject.value;
  const currentDroppedORF = this.droppedORFsubject.value;

  if (index >= 0 && index < currentDroppedORF.length) {
    const movedORF = currentDroppedORF.splice(index, 1)[0];
    currentORFButtons.push(movedORF);

    this.ORFsubject.next(currentORFButtons);
    this.droppedORFsubject.next(currentDroppedORF);
  }
}

moveDroppedToRS(index: number) {
  const currentRSButtons = this.RSsubject.value;
  const currentDroppedRS = this.droppedRSsubject.value;

  if (index >= 0 && index < currentDroppedRS.length) {
    const movedRS = currentDroppedRS.splice(index, 1)[0];
    currentRSButtons.push(movedRS);

    this.RSsubject.next(currentRSButtons);
    this.droppedRSsubject.next(currentDroppedRS);
  }
}
}

