import { Injectable } from '@angular/core';
import enzymeData from './assets/enzyme-data.json';
import { Subject } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
    providedIn: 'root',
})
export class RegexService {
    plasmid:string = '';
    complement:string = '';

    linear:string = '';
    linearComplement:string = '';
    
    readonly enzymeData: Record<string, string> = enzymeData;
    regexPatterns = Object.keys(this.enzymeData);

    combinedPlasmidRegex!: RegExp;
    combinedPlasmidRegexList: string[] = []

    combinedLinearRegex!: RegExp;
    combinedLinearRegexList: string[] = []

    shownPlasmidRegex: Record<string,number> = {}
    shownPlasmidRegexUpdate = new Subject<void>();

    priorityPattern: Record<string, number> = {}

    constructor(private router: Router) {}

    getLowFrequencyPlasmidPatterns(plasmid: string): void {
        const plasmidPatterns: string[] = [];
        let match;
        const priority: string[] = [];

        this.regexPatterns.forEach(pattern => {
            const regex = new RegExp(pattern, 'g');
            const plasmidMatchCount = (plasmid.match(regex) || []).length;
            

            if (plasmidMatchCount > 1 && plasmidMatchCount < 5) {
                plasmidPatterns.push(pattern);
            }
            if (plasmidMatchCount == 1) { //&& !this.combinedLinearRegex.source.includes(pattern)
                match = regex.exec(plasmid)
                this.shownPlasmidRegex[this.enzymeData[pattern]] = match!.index
                priority.push(pattern)
                this.priorityPattern[this.enzymeData[pattern]] = match![0].length
            }
        });
        this.shownPlasmidRegexUpdate.next();
        this.combinedPlasmidRegexList = priority.concat(plasmidPatterns)
        this.combinedPlasmidRegex = new RegExp(priority.concat(plasmidPatterns).join('|'), 'g');
        
        if (this.combinedLinearRegex.toString() === '/(?:)/g') {
            this.router.navigate(['/error', 'Plasmid has no regexes'])
            throw new Error('Plasmid has no regexes');
        }
        if (Object.keys(this.shownPlasmidRegex).length === 0) {
            this.router.navigate(['/error', 'There is no place to insert linear in the plasmid'])
            throw new Error('There is no place to insert linear in the plasmid')
        }
    }

    getLowFrequencyLinearPatterns(linear: string): void {
        const linearPatterns: string[] = [];
        let match;
        const priority: string[] = [];

        this.regexPatterns.forEach(pattern => {
            const regex = new RegExp(pattern, 'g');
            const linearMatchCount = (linear.match(regex) || []).length;

            if (linearMatchCount > 1 && linearMatchCount < 5) {
                linearPatterns.push(pattern);
            }
            if (linearMatchCount == 1) {
                match = regex.exec(linear)
                priority.push(pattern);
            }
        });

        this.combinedLinearRegexList = priority.concat(linearPatterns);
        this.combinedLinearRegex = new RegExp(priority.concat(linearPatterns).join('|'), 'g');

        if (this.combinedLinearRegex.toString() === '/(?:)/g') {
            throw new Error('Linear has no regexes');
        }
    }


    highlightPlasmidText(inputText: string): string {
        let svgText = '';

        for (let i = 0; i < inputText.length; i++) {
            // Flag to check if a match is found at this position
            let matchFound = false;

            for (const pattern of this.combinedPlasmidRegexList) {
                const regex = new RegExp(`^${pattern}`);
                const match = inputText.substring(i).match(regex);

                if (match) {
                    const enzymeClass = this.enzymeData[pattern];
                    svgText += `<tspan class="highlight ${enzymeClass}">${inputText[i]}</tspan>`;
                    matchFound = true;
                    break; // Stop checking other patterns if a match is found
                }
            }

            if (!matchFound) {
                // Append the character as is, if no match is found
                svgText += inputText[i];
            }
        }

        return svgText;
    }




    

    highlightLinearText(inputText: string): string {
        let htmlText = '';

        for (let i = 0; i < inputText.length; i++) {
            // Flag to check if a match is found at this position
            let matchFound = false;

            for (const pattern of this.combinedLinearRegexList) {
                const regex = new RegExp(`^${pattern}`);
                const match = inputText.substring(i).match(regex);

                if (match) {
                    const enzymeClass = this.enzymeData[pattern];
                    // Wrapping only the first letter of the match
                    htmlText += `<div class="highlight-container">
                                 <div class="label">${enzymeClass}</div>
                                 <span class="highlight ${enzymeClass}">${inputText[i]}</span>
                             </div>`;
                    matchFound = true;
                    break; // Stop checking other patterns if a match is found
                }
            }

            if (!matchFound) {
                // Append the character as is, if no match is found
                htmlText += inputText[i];
            }
        }

        return htmlText;
    }

    
    
    highlightOrfsWithCaseVerbose(sequence:string, minSize:number, maxSize:number, type:number) {
        const stopCodons = new Set(["TAA", "TAG", "TGA"]);
        // Create 3 Arrays to prevent overlapping
        let coloredSeq0 = Array(sequence.length).fill(' ');
        let coloredSeq1 = Array(sequence.length).fill(' ');
        let coloredSeq2 = Array(sequence.length).fill(' ');
        const sequenceLength = sequence.length;

        for (let frame = 0; frame < 3; frame++) {
            let i = frame;
            let j = i;
            while (i < sequenceLength - 2) {
                if (j >= sequenceLength - 2) {
                    i += 3
                    break
                }
                let codon = sequence.substring(i, i + 3).toUpperCase();
                if (codon === "ATG") {
                    let start = i;
                    for (j = i; j < sequenceLength; j += 3) {
                        codon = sequence.substring(j, j + 3).toUpperCase();
                        if (stopCodons.has(codon) || j >= sequenceLength - 2) {
                            let end = j + 2;
                            let orfLength = end - start + 1;
                            if (minSize <= orfLength && orfLength <= maxSize) {
                                for (let k = start; k <= end; k++) {
                                    if (frame === 0) coloredSeq0[k] = sequence[k];
                                    if (frame === 1) coloredSeq1[k] = sequence[k];
                                    if (frame === 2) coloredSeq2[k] = sequence[k];
                                }
                            }
                            i = j + 3; // Move to the next codon after the stop codon
                            break;
                        }
                    }
                } else {
                    i += 3;
                }
            }
        }

        // Checks whether ORF is reverse or not
        if (type === 0) {
            return [coloredSeq0.join('').replace(/[ATGC]/g, '>'), 
            coloredSeq1.join('').replace(/[ATGC]/g, '>'), 
            coloredSeq2.join('').replace(/[ATGC]/g, '>')];
        } else {
            return [coloredSeq0.reverse().join("").replace(/[ATGC]/g, '<'),
                coloredSeq1.reverse().join("").replace(/[ATGC]/g, '<'),
                coloredSeq2.reverse().join("").replace(/[ATGC]/g, '<')];
        }
    }

}