import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'ui-field-label',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label
      [attr.for]="for()"
      class="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5 cursor-pointer"
    >
      <ng-content />
    </label>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class FieldLabelComponent {
  for = input.required<string>();
}
