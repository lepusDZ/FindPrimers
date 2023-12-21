import { Component, ViewChild, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { NgForm } from '@angular/forms';
import { InputService } from '../../services/input.service';
import { MatTooltip } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { vectorExample,linearExample } from './example';


@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss']
})
export class FormComponent implements OnDestroy {
  input: string = '';
  sanitizedInput: string = '';
  min: number = 100;
  max:number = 20000;

  label: string = "Paste the Vector Sequence";
  placeholder: string = 'TTCTTGAAGACGAAAGGGCCTCGTGATACGCCTATTTTTATAGGTTAATGTCATGATAATAATGGTTTCTTAGACGT....';

  isFirstInputSubmitted: boolean = false;
  isSecondInputSubmitted: boolean = false;
  showSpinner: boolean = false;

  tooltipNotAllowed: boolean = true;
  isFirstPaste: boolean = true; // Track if it's the first paste

  @ViewChild('tooltip') tooltip!: MatTooltip;

  constructor(private inputService: InputService, private cdr: ChangeDetectorRef, private router: Router) { }

  onInputChange(newValue: string): void {
    // Sanitize the input right away
    if (newValue) {
      this.sanitizedInput = newValue.replace(/[^ATGCatgc]/g, '');
    
      // Proceed with the sanitized value
      if (!this.isFirstInputSubmitted) {
        this.inputService.setInput(this.sanitizedInput);
      } else if (!this.isSecondInputSubmitted) {
        this.inputService.setSecondInput(this.sanitizedInput);
      } else {
        this.showSpinner = true;
      }
    } else {
      if (!this.isFirstInputSubmitted) {
        this.inputService.setInput('');
      } else if (!this.isSecondInputSubmitted) {
        this.inputService.setSecondInput('');
      } else {
        this.showSpinner = true;
    }
  }
}


  onSubmit(form: NgForm): void {
    if (form.valid) {
      if (!this.isFirstInputSubmitted) {
        this.inputService.saveFirstInput(this.input);

        this.inputService.pORFmin = this.min
        this.inputService.pORFmax = this.max

        // resets the form and now linear must be entered
        this.isFirstInputSubmitted = true;
        this.label = "Paste the Insert Sequence"
      } else {
        this.showSpinner = true;
        this.inputService.saveSecondInput(this.input);

        this.inputService.lORFmin = this.min
        this.inputService.lORFmax = this.max

        this.isSecondInputSubmitted = true;
        this.router.navigate(['/scroll']);
      }
      
      form.resetForm({
        min: this.min,  // Preserve the current min value
        max: this.max
      });
    }
  }

  onExample() {
    if (!this.isFirstInputSubmitted) {
      this.input = vectorExample;
      this.onInputChange(this.input);
    } else if (!this.isSecondInputSubmitted) {
      this.input = linearExample;
      this.onInputChange(this.input);
    } 
  }


  // if the text is pasted for the first time shows
  // that it is filtered
  handlePaste(): void {
    if (this.isFirstPaste) {
      this.isFirstPaste = false;
      this.tooltipNotAllowed = false;
      this.cdr.detectChanges();
      this.tooltip.show();

      setTimeout(() => {
        this.tooltipNotAllowed = true;
      }, 3000);
    }
  }

  get isInputValid(): boolean {
    if (this.input) {
      return this.sanitizedInput.length >= 500 || (this.sanitizedInput.length >= 20 && this.isFirstInputSubmitted);
    } return false;
  }
  
  ngOnDestroy(): void {
    
    this.input = '';
    this.sanitizedInput = '';
    this.min = 100;
    this.max = 20000;
    this.isFirstInputSubmitted = false;
    this.isSecondInputSubmitted = false;
    this.showSpinner = false;
    this.tooltipNotAllowed = true;
    this.isFirstPaste = true;

  }
}