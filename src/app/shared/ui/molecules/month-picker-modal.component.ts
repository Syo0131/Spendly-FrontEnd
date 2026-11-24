import { Component, ChangeDetectionStrategy, inject, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { isFutureMonth } from '../../../core/utils/month';
import { IconComponent } from '../atoms/icon.component';
import { ButtonComponent } from '../atoms/button.component';

export interface MonthPickerData {
  current: Date;
  locale?: string;
}

@Component({
  selector: 'ui-month-picker-modal',
  standalone: true,
  imports: [CommonModule, IconComponent, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Seleccionar mes"
      class="w-full max-w-sm bg-surface border border-border rounded-2xl shadow-2xl p-5 space-y-4"
    >
      <!-- Year header -->
      <div class="flex items-center justify-between">
        <button
          type="button"
          uiButton
          variant="ghost"
          size="sm"
          (click)="prevYear()"
          aria-label="Año anterior"
        >
          <ui-icon name="chevron_left" size="sm" />
        </button>

        <span class="text-base font-bold text-fg-default font-heading tabular-nums">
          {{ displayedYear() }}
        </span>

        <button
          type="button"
          uiButton
          variant="ghost"
          size="sm"
          [disabled]="displayedYear() >= today.getFullYear()"
          (click)="nextYear()"
          aria-label="Año siguiente"
        >
          <ui-icon name="chevron_right" size="sm" />
        </button>
      </div>

      <!-- Month grid -->
      <div class="grid grid-cols-3 gap-2">
        @for (m of monthList(); track m.index) {
          <button
            type="button"
            [disabled]="m.disabled"
            (click)="selectMonth(m.index)"
            class="h-10 rounded-lg text-sm font-medium transition-colors select-none capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            [class.bg-accent]="m.isSelected"
            [class.text-accent-contrast]="m.isSelected"
            [class.font-bold]="m.isSelected"
            [class.shadow-sm]="m.isSelected"
            [class.text-ink]="!m.isSelected && !m.disabled"
            [class.hover:bg-surface-raised]="!m.isSelected && !m.disabled"
            [class.text-ink-subtle]="m.disabled"
            [class.opacity-40]="m.disabled"
            [class.cursor-not-allowed]="m.disabled"
          >
            {{ m.name }}
          </button>
        }
      </div>

      <!-- Footer cancel -->
      <div class="pt-2 border-t border-border-subtle flex justify-end">
        <button
          type="button"
          uiButton
          variant="ghost"
          size="sm"
          (click)="close()"
        >
          Cerrar
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class MonthPickerModalComponent {
  private dialogRef = inject(DialogRef<Date | null, MonthPickerModalComponent>);
  private data: MonthPickerData = inject(DIALOG_DATA, { optional: true }) ?? {
    current: new Date(),
    locale: 'es-DO',
  };

  today = new Date();
  currentDate = this.data.current || new Date();
  locale = this.data.locale || 'es-DO';

  displayedYear = signal<number>(this.currentDate.getFullYear());

  monthList = computed(() => {
    const year = this.displayedYear();
    const currYear = this.currentDate.getFullYear();
    const currMonth = this.currentDate.getMonth();
    const formatter = new Intl.DateTimeFormat(this.locale, { month: 'short' });

    return Array.from({ length: 12 }, (_, i) => {
      const monthDate = new Date(year, i, 1);
      const name = formatter.format(monthDate);
      const disabled = isFutureMonth(year, i + 1, this.today);
      const isSelected = year === currYear && i === currMonth;

      return {
        index: i,
        name,
        disabled,
        isSelected,
      };
    });
  });

  @HostListener('window:keydown.escape')
  onEscape(): void {
    this.close();
  }

  prevYear(): void {
    this.displayedYear.update(y => y - 1);
  }

  nextYear(): void {
    if (this.displayedYear() < this.today.getFullYear()) {
      this.displayedYear.update(y => y + 1);
    }
  }

  selectMonth(monthIndex: number): void {
    if (isFutureMonth(this.displayedYear(), monthIndex + 1, this.today)) {
      return;
    }
    const selected = new Date(this.displayedYear(), monthIndex, 1);
    this.dialogRef.close(selected);
  }

  close(): void {
    this.dialogRef.close(null);
  }
}
