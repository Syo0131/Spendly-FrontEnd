import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FieldLabelComponent } from '../atoms/field-label.component';

@Component({
  selector: 'ui-form-field',
  standalone: true,
  imports: [CommonModule, FieldLabelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-1.5 w-full">
      @if (label()) {
        <ui-field-label [for]="fieldId()">
          {{ label() }}
        </ui-field-label>
      }

      <!-- Projected Form Input Control -->
      <div class="relative">
        <ng-content />
      </div>

      <!-- Error / Hint Messaging -->
      @if (error()) {
        <p
          [id]="fieldId() + '-error'"
          class="text-xs text-expense font-medium flex items-center gap-1 mt-1 animate-fade-in"
          role="alert"
        >
          {{ error() }}
        </p>
      } @else if (hint()) {
        <p [id]="fieldId() + '-hint'" class="text-xs text-ink-subtle mt-1">
          {{ hint() }}
        </p>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class FormFieldComponent {
  label = input<string>('');
  fieldId = input.required<string>();
  hint = input<string | undefined>(undefined);
  error = input<string | null | undefined>(undefined);
}
