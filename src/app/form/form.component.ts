import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { InputService } from '../services/input.service';

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss']
})
export class FormComponent {
  input: string = '';
  isFirstInputSubmitted: boolean = false;

  constructor(private inputService: InputService) { }

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
      } else {
        this.inputService.saveSecondInput(this.input)
      }
      form.resetForm();
    }
  }
}
