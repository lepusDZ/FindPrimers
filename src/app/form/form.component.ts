import { Component, ViewChild, ChangeDetectorRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import { InputService } from '../services/input.service';
import { MatTooltip } from '@angular/material/tooltip';

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss']
})
export class FormComponent {
  input: string = '';
  label: string = "Paste the Plasmid Sequence";
  placeholder: string = 'AGCAGGCAAAGCGCGC...';
  
  isFirstInputSubmitted: boolean = false;
  tooltipNotAllowed:boolean = true;
  isFirstPaste: boolean = true; // Track if it's the first paste
  
  @ViewChild('tooltip') tooltip!: MatTooltip;

  constructor(private inputService: InputService, private cdr: ChangeDetectorRef) { }

  onInputChange(newValue: string): void {
    if (!this.isFirstInputSubmitted) {
      this.inputService.setInput(newValue);
    } else {
      this.inputService.setSecondInput(newValue);
    }
  }

  onSubmit(form: NgForm): void {
    if (form.valid) {
      if (!this.isFirstInputSubmitted) {
        this.inputService.saveFirstInput(this.input);
        this.isFirstInputSubmitted = true;
        this.label = "Paste the Linear Sequence"
      } else {
        this.inputService.saveSecondInput(this.input);
      }
      form.resetForm();
    }
  }

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
}
