import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { RegexService } from './regex.service';

@Injectable({
    providedIn: 'root',
})
export class InputService {
    private inputSubject: BehaviorSubject<string> = new BehaviorSubject<string>('');
    private processedInputSubject: BehaviorSubject<string> = new BehaviorSubject<string>('');
    private secondInputSubject: BehaviorSubject<string> = new BehaviorSubject<string>('');
    private processedSecondSubject: BehaviorSubject<string> = new BehaviorSubject<string>('');

    input$ = this.inputSubject.asObservable();
    processed$ = this.processedInputSubject.asObservable();
    secondInput$ = this.secondInputSubject.asObservable();
    secondProcessed$ = this.processedSecondSubject.asObservable()

    firstInput: string = '';
    secondInput: string = '';
    
    
    processedInput: string = '';
    processedSecond:string = '';

    reversedInput: string = '';
    reversedSecond:string = '';

    pORFmin: number = 100; // plasmid orf min
    pORFmax:number = 20000;
    lORFmin: number = 100; // linear orf min
    lORFmax: number = 20000;

    constructor(private regexService: RegexService) {}
    
    setInput(value: string): void {
        this.inputSubject.next(value.toUpperCase());
        this.processedInputSubject.next(this.translateValue(value.toUpperCase()));
    }

    saveFirstInput(value: string): void {
        if (value) {            
            this.firstInput = value.toUpperCase();
            this.regexService.plasmid = this.firstInput; 
            this.processedInput = this.translateValue(this.firstInput);
            this.reversedInput = this.processedInput.split("").reverse().join("");
        }
    }

    setSecondInput(value: string): void {
        if (value) {
            this.secondInputSubject.next(value.toUpperCase())
            this.processedSecondSubject.next(this.translateValue(value.toUpperCase()))
        }
    }
    
    saveSecondInput(value:string): void {
        this.secondInput = value.toUpperCase()
        this.regexService.linear = this.secondInput;
        this.processedSecond = this.translateValue(this.secondInput)
        this.reversedSecond = this.processedSecond.split("").reverse().join("");
    }

    
    translateValue(value: string): string {
        return value.split('').map(char => {
            switch (char) {
                case 'A': return 'T';
                case 'T': return 'A';
                case 'G': return 'C';
                case 'C': return 'G';
                default: return char; // Keep other characters as is
            }
        }).join('');
    }
    
}