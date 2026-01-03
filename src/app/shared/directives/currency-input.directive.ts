import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[appCurrencyInput]',
  standalone: true,
})
export class CurrencyInputDirective {
  private regex: RegExp = new RegExp(/^[0-9]+(\.[0-9]*){0,1}$/g);
  private specialKeys: Array<string> = [
    'Backspace',
    'Tab',
    'End',
    'Home',
    'ArrowLeft',
    'ArrowRight',
    'Delete',
    'Enter',
  ];

  constructor(private el: ElementRef) {}

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    // Allow Backspace, tab, end, and home keys
    if (this.specialKeys.indexOf(event.key) !== -1) {
      return;
    }

    // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    if (
      (event.ctrlKey || event.metaKey) &&
      ['a', 'c', 'v', 'x'].indexOf(event.key.toLowerCase()) !== -1
    ) {
      return;
    }

    const current: string = this.el.nativeElement.value;
    const next: string = current.concat(event.key);

    if (next && !String(next).match(this.regex)) {
      event.preventDefault();
    }
  }

  @HostListener('blur', ['$event'])
  onBlur(event: FocusEvent) {
    const input = event.target as HTMLInputElement;
    if (input.value) {
      // Format to 2 decimal places on blur if it's a valid number
      const val = parseFloat(input.value);
      if (!isNaN(val)) {
        input.value = val.toFixed(2);
        // Dispatch input event to update form control
        input.dispatchEvent(new Event('input'));
      }
    }
  }
}
