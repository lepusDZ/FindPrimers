import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { InputService } from './input.service'
import { catchError, tap, throwError } from 'rxjs';
import enzymeData from './assets/enzyme-data.json';


@Injectable({
    providedIn: 'root',
})
export class RegexService {
    plasmid:string = '';
    complement:string = '';

    linear:string = '';
    linearComplement:string = '';
    reversedLinearComplement:string = '';
    
    ORFs:string[] = [];
    CSs:string[] = [];
    readonly enzymeData: Record<string, string> = enzymeData;
    regexPatterns = Object.keys(this.enzymeData);

    highlightText(inputText: string): string {
        let svgText = '';
        const regexPatterns = Object.keys(this.enzymeData).join('|'); // Combine all patterns
        const combinedRegex = new RegExp(regexPatterns, 'g');
        let lastIndex = 0;
        let match:any;

        while ((match = combinedRegex.exec(inputText)) !== null) {
            // Text before the match
            svgText += `<tspan>${inputText.substring(lastIndex, match.index)}</tspan>`;

            // Find which pattern was matched
            const matchedPattern = Object.keys(this.enzymeData).find(pattern => new RegExp(pattern).test(match[0]));
            if (matchedPattern) {
                const enzymeClass = this.enzymeData[matchedPattern];
                svgText += `<tspan class="highlight ${enzymeClass}">${match[0]}</tspan>`;
            }

            // Highlighted text

            lastIndex = match.index + match[0].length;
        }

        // Remaining text after the last match
        svgText += `<tspan>${inputText.substring(lastIndex)}</tspan>`;
        return svgText;
    }




    findORFs(){

    }

    findCSs(){

    }

    highlightCSs() {

    }   
}