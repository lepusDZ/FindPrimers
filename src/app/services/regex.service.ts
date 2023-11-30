import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class RegexService {
    sequence:string = '';
    complement:string = '';
    ORFs:string[] = [];
    CSs:string[] = [];

    set(sequence:string, complement:string) {
        this.sequence = sequence
        this.complement = complement
    }
}