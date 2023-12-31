import { Directive, HostListener, ElementRef, Renderer2, Output, EventEmitter } from '@angular/core';

@Directive({
  selector: '[appAtgcInputRestrictor]'
})
export class AtgcInputRestrictorDirective {
  private allowedChars = new Set(['a', 't', 'g', 'c', 'A', 'T', 'G', 'C']);
  @Output() pasteEvent = new EventEmitter<void>();

  constructor(private el: ElementRef, private renderer: Renderer2) { }

  @HostListener('input', ['$event']) onInputChange(event: any) {
    const initialValue = event.target.value;
    const newValue = initialValue.replace(/[^ATGCatgc]/g, '');

    if (initialValue !== newValue) {
      event.preventDefault(); // Prevent the default input event
      event.stopPropagation(); // Stop the propagation of the event
      this.renderer.setProperty(this.el.nativeElement, 'value', newValue); // Set the new value without invalid characters
      this.addErrorEffect();
    }
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent) {
    event.preventDefault();
    const clipboardData = event.clipboardData;
    if (clipboardData) {
      const pastedText = clipboardData.getData('text');
      const filteredText = pastedText.split('').filter(char => this.allowedChars.has(char)).join('');

      // Check if the total characters exceed the maximum limit
      if (this.el.nativeElement.value.length + filteredText.length > 20000) {
        // Truncate the pasted text to fit within the limit
        const remainingCharacters = 20000 - this.el.nativeElement.value.length;
        const truncatedText = filteredText.substring(0, remainingCharacters);
        this.insertTextAtCursorPosition(truncatedText);
        this.addErrorEffect();
      } else {
        this.insertTextAtCursorPosition(filteredText);
      }

      this.pasteEvent.emit(); // Emit event on paste
    }
  }

  private insertTextAtCursorPosition(text: string): void {
    const textarea: HTMLTextAreaElement = this.el.nativeElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    textarea.setRangeText(text, start, end, 'end');
    this.triggerInputEvent();
  }

  private triggerInputEvent(): void {
    this.renderer.removeClass(this.el.nativeElement, 'error-shake');
    const event = new Event('input', { bubbles: true });
    this.renderer.selectRootElement(this.el.nativeElement).dispatchEvent(event);
  }

  private addErrorEffect() {
    const formField = this.el.nativeElement.closest('mat-form-field');
    if (formField) {
      this.renderer.addClass(formField, 'error-shake');
      setTimeout(() => {
        this.renderer.removeClass(formField, 'error-shake');
      }, 500); // Duration of the shake animation
    }
  }
}
