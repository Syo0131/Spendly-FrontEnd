import { Component, ChangeDetectionStrategy, input, model, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { isFutureMonth, shiftMonth } from '../../../core/utils/month';
import { UiDialogService } from '../organisms/dialog.service';
import { IconComponent } from '../atoms/icon.component';
import { ButtonComponent } from '../atoms/button.component';
import { MonthPickerModalComponent } from './month-picker-modal.component';

@Component({
  selector: 'ui-month-selector',
  standalone: true,
  imports: [CommonModule, IconComponent, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      role="group"
      aria-label="Selector de período mensual"
      class="inline-flex items-center gap-1 bg-surface-card border border-border-subtle rounded-xl p-1 shadow-sm select-none"
    >
      <button
        type="button"
        uiButton
        variant="ghost"
        size="sm"
        (click)="prevMonth()"
        aria-label="Mes anterior"
      >
        <ui-icon name="chevron_left" size="sm" />
      </button>

      <button
        type="button"
        (click)="openPicker()"
        class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-semibold text-fg-default hover:bg-surface-muted transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
        aria-label="Abrir selector de mes y año"
      >
        <ui-icon name="calendar_today" size="sm" class="text-fg-muted" />
        <span class="capitalize">{{ label() }}</span>
        <ui-icon name="expand_more" size="sm" class="text-fg-muted" />
      </button>

      <button
        type="button"
        uiButton
        variant="ghost"
        size="sm"
        [disabled]="isNextDisabled()"
        (click)="nextMonth()"
        aria-label="Mes siguiente"
      >
        <ui-icon name="chevron_right" size="sm" />
      </button>
    </div>
  `,
  styles: [`
    :host {
      display: inline-block;
    }
  `]
})
export class MonthSelectorComponent {
  private dialogService = inject(UiDialogService);

  value = model<Date>(new Date());
  locale = input<string>('es-DO');

  label = computed(() => {
    const d = this.value();
    const formatted = new Intl.DateTimeFormat(this.locale(), {
      month: 'long',
      year: 'numeric',
    }).format(d);
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  });

  isNextDisabled = computed(() => {
    const nextDate = shiftMonth(this.value(), 1);
    return isFutureMonth(nextDate.getFullYear(), nextDate.getMonth() + 1, new Date());
  });

  prevMonth(): void {
    this.value.set(shiftMonth(this.value(), -1));
  }

  nextMonth(): void {
    if (!this.isNextDisabled()) {
      this.value.set(shiftMonth(this.value(), 1));
    }
  }

  openPicker(): void {
    const ref = this.dialogService.open(MonthPickerModalComponent, {
      data: {
        current: this.value(),
        locale: this.locale(),
      },
      size: 'sm',
      sheetOnMobile: true,
    });

    ref.closed.subscribe((result) => {
      if (result instanceof Date) {
        this.value.set(result);
      }
    });
  }
}
