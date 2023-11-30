import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

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
    reversedComplement:string = '';

    setInput(value: string): void {
        this.inputSubject.next(value.toUpperCase());
        this.processedInputSubject.next(this.translateValue(value.toUpperCase()));
    }

    saveFirstInput(value: string): void {
        this.firstInput = value.toUpperCase();
        this.processedInput = this.translateValue(this.firstInput);
    }

    setSecondInput(value: string): void {
        this.secondInputSubject.next(value.toUpperCase())
        this.processedSecondSubject.next(this.translateValue(value.toUpperCase()))
    }
    
    saveSecondInput(value:string): void {
        this.secondInput = value.toUpperCase()
        this.processedSecond = this.translateValue(this.secondInput)
        this.reversedComplement = this.reverseString(this.processedSecond)
    }

    private reverseString(str:string) {
        return str.split("").reverse().join("");
}
    private translateValue(value: string): string {
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