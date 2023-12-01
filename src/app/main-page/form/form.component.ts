import { Component, ViewChild, ChangeDetectorRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import { InputService } from '../../services/input.service';
import { MatTooltip } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { RegexService } from '../../services/regex.service';

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss']
})
export class FormComponent {
  input: string = '';
  label: string = "Paste the Plasmid Sequence";
  placeholder: string = 'TTCTTGAAGACGAAAGGGCCTCGTGATACGCCTATTTTTATAGGTTAATGTCATGATAATAATGGTTTCTTAGACGT....';

  isFirstInputSubmitted: boolean = false;
  isSecondInputSubmitted: boolean = false;

  tooltipNotAllowed: boolean = true;
  isFirstPaste: boolean = true; // Track if it's the first paste

  @ViewChild('tooltip') tooltip!: MatTooltip;

  constructor(private inputService: InputService, private cdr: ChangeDetectorRef, private router: Router) { }

  onInputChange(newValue: string): void {
    if (!this.isFirstInputSubmitted) {
      this.inputService.setInput(newValue);
    } else if (!this.isSecondInputSubmitted) {
      this.inputService.setSecondInput(newValue);
    } else {
      this.router.navigate(['/scroll']);
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
        this.isSecondInputSubmitted = true;
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
