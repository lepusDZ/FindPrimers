import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { RegexService } from './regex.service';
import { InputService } from './input.service';

@Injectable({
    providedIn: 'root'
})
export class ButtonService {
    private RSsubject = new BehaviorSubject<string[]>([]);
    private droppedORFsubject = new BehaviorSubject<string[]>([]);
    private droppedRSsubject = new BehaviorSubject<string[]>([]);
    
    private outputSubject = new BehaviorSubject<string[]>([]);
    output = this.outputSubject.asObservable();

    RSbuttons = this.RSsubject.asObservable();

    droppedORF = this.droppedORFsubject.asObservable();
    droppedRS = this.droppedRSsubject.asObservable();

    RSpositions: Record<string,number> = {};


    constructor(private regexService: RegexService, private inputService: InputService) {
      // Takes the button values from the shownPlasmidRegex
      this.regexService.shownPlasmidRegexUpdate.subscribe(() => {
        this.updateRSButtons();
      });
    }

  
  private updateRSButtons(): void {
    this.RSpositions = this.regexService.shownPlasmidRegex
    this.RSsubject.next(Object.keys(this.RSpositions));
  }

    moveORFToDropped(index: number) {
        const currentRSButtons = this.RSsubject.value;
        const currentDroppedORF = this.droppedORFsubject.value;

      if (index >= 0 && index < currentRSButtons.length) {
        const movedORF = currentRSButtons.splice(index, 1)[0];

            // If there's a value in the dropped list, move it back to ORFbuttons
            if (currentDroppedORF.length > 0) {
                const prevDroppedORF = currentDroppedORF.splice(0, 1)[0];
              currentRSButtons.push(prevDroppedORF);
            }

            currentDroppedORF.push(movedORF);

            this.RSsubject.next(currentRSButtons);
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


  // Moves the button from Dropped buttons back
  moveDroppedToORF(index: number) {
  const currentRSButtons = this.RSsubject.value;
  const currentDroppedORF = this.droppedORFsubject.value;

  if (index >= 0 && index < currentDroppedORF.length) {
    const movedORF = currentDroppedORF.splice(index, 1)[0];
    currentRSButtons.push(movedORF);

    this.RSsubject.next(currentRSButtons);
    this.droppedORFsubject.next(currentDroppedORF);
  }
}

// Moves the button from Dropped buttons back
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

  // Calculates output for the last page
  calculateOutput(rs1:string, rs2:string) {
    let rs1position:number = this.RSpositions[rs1];
    let rs2position:number = this.RSpositions[rs2];
    
    let output:string[] = []

    let plasmid = this.regexService.plasmid
    let linear = this.regexService.linear
    
   output.push(plasmid.slice(rs1position-6,rs1position+this.regexService.priorityPattern[rs1]) + linear.slice(0,20))
    output.push(this.inputService.translateValue(linear.slice(-20) + plasmid.slice(rs2position, rs2position + this.regexService.priorityPattern[rs2] + 6)).split("").reverse().join(""))

    this.outputSubject.next(output)
  }
}

