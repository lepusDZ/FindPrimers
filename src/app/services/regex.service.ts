import { Injectable, OnInit } from '@angular/core';
import enzymeData from './assets/enzyme-data.json';


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

    filteredPlasmidPatterns: string[] = [];
    combinedPlasmidRegex: RegExp;

    filteredLinearPatterns: string[] = [];
    combinedLinearRegex: RegExp;

    constructor() {
        this.filteredPlasmidPatterns = this.filterRegexByFrequency(true);
        this.combinedPlasmidRegex = new RegExp(this.filteredPlasmidPatterns.join('|'), 'g');
        this.filteredLinearPatterns = this.filterRegexByFrequency(false);
        this.combinedLinearRegex = new RegExp(this.filteredLinearPatterns.join('|'), 'g');
        console.log(this.regexPatterns)
        console.log(this.combinedPlasmidRegex)
        console.log(this.combinedLinearRegex)
    }

    ngOnInit(): void {
    }


    private filterRegexByFrequency(type:boolean): string[] {
        const filteredPatterns: string[] = [];

        this.regexPatterns.forEach(pattern => {
            const regex = new RegExp(pattern, 'g');
            let frequency = 0;

            while (regex.exec((type) ? this.plasmid : this.linear) !== null) {
                frequency++;
            }

            if (frequency < 20) {
                filteredPatterns.push(pattern);
            }
        });

        return filteredPatterns;
    }


    highlightPlasmidText(inputText: string): string {
        let svgText = '';
        let lastIndex = 0;
        let match:any;

        while ((match = this.combinedPlasmidRegex.exec(inputText)) !== null) {
            // Text before the match
            svgText += `${inputText.substring(lastIndex, match.index)}`;

            // Find which pattern was matched
            const matchedPattern = Object.keys(this.enzymeData).find(pattern => new RegExp(pattern).test(match[0]));
            if (matchedPattern) {
                const enzymeClass = this.enzymeData[matchedPattern];
                svgText += `<tspan class="highlight ${enzymeClass}">${match[0][0]}</tspan>${match[0].slice(1)}`;
            }
            

            // Highlighted text

            lastIndex = match.index + match[0].length;
        }

        // Remaining text after the last match
        svgText += `${inputText.substring(lastIndex)}`;
        console.log(this.plasmid.length)
        console.log(this.linear.length)
        return svgText;
    }




    highlightLinearText(inputText: string): string {
        let svgText = '';
        let lastIndex = 0;
        let match: any;

        while ((match = this.combinedLinearRegex.exec(inputText)) !== null) {
            // Text before the match
            svgText += `${inputText.substring(lastIndex, match.index)}`;

            // Find which pattern was matched
            const matchedPattern = Object.keys(this.enzymeData).find(pattern => new RegExp(pattern).test(match[0]));
            if (matchedPattern) {
                const enzymeClass = this.enzymeData[matchedPattern];
                svgText += `<span class="highlight ${enzymeClass}">${match[0][0]}</span>${match[0].slice(1)}`;
            }


            // Highlighted text

            lastIndex = match.index + match[0].length;
        }

        // Remaining text after the last match
        svgText += `${inputText.substring(lastIndex)}`;
        return svgText;
    }

}