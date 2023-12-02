import { Injectable, OnInit } from '@angular/core';
import enzymeData from './assets/enzyme-data.json';

export interface Orf {
    start: number;
    end: number;
    direction: 'forward' | 'reverse';
}

@Injectable({
    providedIn: 'root',
})
export class RegexService implements OnInit {
    plasmid:string = '';
    complement:string = '';

    linear:string = '';
    linearComplement:string = '';
    reversedLinearComplement:string = '';
    
    readonly enzymeData: Record<string, string> = enzymeData;
    regexPatterns = Object.keys(this.enzymeData);

    combinedPlasmidRegex!: RegExp;

    filteredLinearPatterns: string[] = [];
    combinedLinearRegex!: RegExp;

    constructor() {
    }

    ngOnInit(): void {
    }

    getLowFrequencyPlasmidPatterns(plasmid: string): void {
        const plasmidPatterns: string[] = [];

        this.regexPatterns.forEach(pattern => {
            const regex = new RegExp(pattern, 'g');
            const plasmidMatchCount = (plasmid.match(regex) || []).length;

            if (plasmidMatchCount > 0 && plasmidMatchCount < 15) {
                plasmidPatterns.push(pattern);
            }
        });

        this.combinedPlasmidRegex = new RegExp(plasmidPatterns.join('|'), 'g');
        if (this.combinedLinearRegex.toString() === '/(?:)/g') {
            throw new Error('Plasmid has no regexes');
        }
    }

    getLowFrequencyLinearPatterns(linear: string): void {
        const linearPatterns: string[] = [];

        this.regexPatterns.forEach(pattern => {
            const regex = new RegExp(pattern, 'g');
            const linearMatchCount = (linear.match(regex) || []).length;

            if (linearMatchCount > 0 && linearMatchCount < 15) {
                linearPatterns.push(pattern);
            }
        });

        this.combinedLinearRegex = new RegExp(linearPatterns.join('|'), 'g');

        if (this.combinedLinearRegex.toString() === '/(?:)/g') {
            throw new Error('Linear has no regexes');

        }
    }




    highlightPlasmidText(inputText: string): string {
        let svgText = '';
        let lastIndex = 0;
        let match:any;

        while ((match = this.combinedPlasmidRegex.exec(inputText)) !== null) {
            // Text before the match
            svgText += `${inputText.substring(lastIndex, match.index)}`;
            
            // Find which pattern was matched
            const matchedPattern = this.regexPatterns.find(pattern => new RegExp(pattern).test(match[0]));
            if (matchedPattern === undefined) {
                match = null
            }
            if (matchedPattern) {
                const enzymeClass = this.enzymeData[matchedPattern];
                svgText += `<tspan class="highlight ${enzymeClass}">${match[0][0]}</tspan>${match[0].slice(1)}`;
            }
            

            // Highlighted text

            lastIndex = match.index + match[0].length;
        }

        // Remaining text after the last match
        svgText += `${inputText.substring(lastIndex)}`;
        return svgText;
    }

    

    highlightLinearText(inputText: string): string {
        let htmlText = '';
        let lastIndex = 0;
        let match: any;

        while ((match = this.combinedLinearRegex.exec(inputText)) !== null) {
            // Text before the match
            htmlText += `${inputText.substring(lastIndex, match.index)}`;

            // Find which pattern was matched
            const matchedPattern = this.regexPatterns.find(pattern => new RegExp(pattern).test(match[0]));
            if (matchedPattern === undefined) {
                continue; // Skip if no pattern is matched
            }

            const enzymeClass = this.enzymeData[matchedPattern];
            // Wrap the matched text in a span with a label
            htmlText += `<div class="highlight-container">
                   <div class="label">${enzymeClass}</div>
                   <span class="highlight ${enzymeClass}">${match[0]}</span>
                 </div>`;

            lastIndex = this.combinedLinearRegex.lastIndex;
        }

        // Remaining text after the last match
        htmlText += `${inputText.substring(lastIndex)}`;
        return htmlText;
    }


}