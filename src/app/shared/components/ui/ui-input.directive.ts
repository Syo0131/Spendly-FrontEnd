import { Directive } from '@angular/core';

/**
 * Editorial input styling for native inputs/selects/textareas. Works with
 * reactive forms and ngModel (it only sets classes on the host element).
 *
 *   <input uiInput formControlName="name" />
 *   <input uiInput [class.pl-11]="true" />  // extra classes still compose
 */
@Directive({
  selector: '[uiInput]',
  standalone: true,
  host: {
    class:
      'w-full rounded-xl border border-divider bg-surface-3 px-4 py-3 text-sm text-content ' +
      'transition-all placeholder:text-content-subtle ' +
      'focus:border-primary focus:bg-surface-2 focus:outline-none focus:ring-4 focus:ring-primary/15',
  },
})
export class UiInputDirective {}
