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

    filteredPatterns: string[] = [];

    ngOnInit(): void {
        this.filteredPatterns = this.filterRegexByFrequency();
        console.log('oninit')
    }


    private filterRegexByFrequency(): string[] {
        const filteredPatterns: string[] = [];

        this.regexPatterns.forEach(pattern => {
            const regex = new RegExp(pattern, 'g');
            let frequency = 0;

            while (regex.exec(this.plasmid) !== null) {
                frequency++;
            }

            if (frequency < 20) {
                filteredPatterns.push(pattern);
            }
        });

        return filteredPatterns;
    }


    highlightText(inputText: string): string {
        let svgText = '';
        const filteredPatterns = this.filterRegexByFrequency();
        const combinedRegex = new RegExp(filteredPatterns.join('|'), 'g');
        let lastIndex = 0;
        let match:any;

        while ((match = combinedRegex.exec(inputText)) !== null) {
            // Text before the match
            svgText += `${inputText.substring(lastIndex, match.index)}`;

            // Find which pattern was matched
            const matchedPattern = Object.keys(this.enzymeData).find(pattern => new RegExp(pattern).test(match[0]));
            if (matchedPattern) {
                const enzymeClass = this.enzymeData[matchedPattern];
                svgText += `<tspan class="highlight ${enzymeClass}">${match[0]}</tspan>${match[0].slice(1)}`;
            }
            

            // Highlighted text

            lastIndex = match.index + match[0].length;
        }

        // Remaining text after the last match
        svgText += `${inputText.substring(lastIndex)}`;
        return svgText;
    }

}