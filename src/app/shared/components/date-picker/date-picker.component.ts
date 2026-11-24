import {
  Component,
  forwardRef,
  signal,
  computed,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TranslationService } from '../../../core/services/translation.service';

@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatePickerComponent),
      multi: true,
    },
  ],
  template: `
    <div class="relative w-full">
      <!-- Input Field Trigger -->
      <button
        type="button"
        class="flex items-center justify-between w-full h-10 bg-surface border border-border rounded-md px-3 text-sm cursor-pointer hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring transition-colors group"
        (click)="toggleCalendar()"
      >
        <span [class.text-ink-subtle]="!value()" [class.text-ink]="value()" class="font-medium">
          {{ formattedDate() || (ts.currentLang() === 'es' ? 'Seleccionar fecha' : 'Select Date') }}
        </span>
        <span class="material-icons-outlined text-ink-muted group-hover:text-accent ml-2 text-lg">calendar_today</span>
      </button>

      <!-- Calendar Dropdown -->
      @if (isOpen()) {
        <div
          class="absolute top-full left-0 mt-2 w-full min-w-[300px] bg-surface-raised rounded-2xl shadow-xl border border-border p-4 z-50 animate-scale-in origin-top-left"
        >
          <!-- MONTH VIEW (Year Selector + Month Grid) -->
          @if (view() === 'months') {
            <div>
              <!-- Year Header -->
              <div class="flex items-center justify-between mb-4 px-1">
                <button
                  type="button"
                  (click)="changeYear(-1)"
                  [disabled]="isPastYear(currentYear() - 1)"
                  class="w-8 h-8 flex items-center justify-center hover:bg-surface-sunken rounded-lg text-ink-muted hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <span class="material-icons-outlined text-lg">chevron_left</span>
                </button>

                <span class="text-base font-bold text-ink">
                  {{ currentYear() }}
                </span>

                <button
                  type="button"
                  (click)="changeYear(1)"
                  class="w-8 h-8 flex items-center justify-center hover:bg-surface-sunken rounded-lg text-ink-muted hover:text-ink transition-colors"
                >
                  <span class="material-icons-outlined text-lg">chevron_right</span>
                </button>
              </div>

              <!-- Months Grid -->
              <div class="grid grid-cols-3 gap-2 mb-4">
                @for (month of months; track $index; let i = $index) {
                  <button
                    type="button"
                    (click)="selectMonth(i)"
                    [disabled]="isPastMonth(i)"
                    class="p-2.5 rounded-lg text-xs font-semibold transition-all"
                    [class.bg-accent]="currentMonthIndex() === i"
                    [class.text-accent-fg]="currentMonthIndex() === i"
                    [class.shadow-sm]="currentMonthIndex() === i"
                    [class.text-ink-muted]="currentMonthIndex() !== i && !isPastMonth(i)"
                    [class.hover:bg-surface-sunken]="currentMonthIndex() !== i && !isPastMonth(i)"
                    [class.hover:text-ink]="currentMonthIndex() !== i && !isPastMonth(i)"
                    [class.opacity-30]="isPastMonth(i)"
                    [class.cursor-not-allowed]="isPastMonth(i)"
                  >
                    {{ month }}
                  </button>
                }
              </div>

              <!-- Actions -->
              <div class="flex gap-2">
                <button
                  type="button"
                  (click)="closeCalendar()"
                  class="w-full py-2 rounded-lg border border-border text-ink-muted font-medium hover:bg-surface-sunken transition-colors text-xs"
                >
                  {{ ts.currentLang() === 'es' ? 'Cerrar' : 'Close' }}
                </button>
              </div>
            </div>
          }

          <!-- DAY VIEW -->
          @if (view() === 'days') {
            <div>
              <!-- Header -->
              <div class="flex items-center justify-between mb-3 px-1">
                <button
                  type="button"
                  (click)="changeMonthDayView(-1)"
                  [disabled]="isPastMonth(currentMonthIndex() - 1)"
                  class="w-8 h-8 flex items-center justify-center hover:bg-surface-sunken rounded-lg text-ink-muted hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <span class="material-icons-outlined text-lg">chevron_left</span>
                </button>

                <button
                  type="button"
                  (click)="setView('months')"
                  class="font-bold text-sm text-ink hover:text-accent transition-colors"
                >
                  {{ currentMonthName() }} {{ currentYear() }}
                </button>

                <button
                  type="button"
                  (click)="changeMonthDayView(1)"
                  class="w-8 h-8 flex items-center justify-center hover:bg-surface-sunken rounded-lg text-ink-muted hover:text-ink transition-colors"
                >
                  <span class="material-icons-outlined text-lg">chevron_right</span>
                </button>
              </div>

              <!-- Week Days -->
              <div class="grid grid-cols-7 mb-1.5">
                @for (day of weekDays; track day) {
                  <div class="text-[11px] font-semibold text-center text-ink-subtle uppercase">
                    {{ day }}
                  </div>
                }
              </div>

              <!-- Days Grid -->
              <div class="grid grid-cols-7 gap-1">
                @for (empty of emptyDays(); track $index) {
                  <div></div>
                }

                @for (day of daysInMonth(); track day) {
                  <button
                    type="button"
                    (click)="selectDate(day)"
                    [disabled]="isDateDisabled(day)"
                    class="h-8 rounded-md text-xs font-medium flex items-center justify-center transition-colors relative"
                    [class.bg-accent]="isSelected(day)"
                    [class.text-accent-fg]="isSelected(day)"
                    [class.shadow-sm]="isSelected(day)"
                    [class.hover:bg-surface-sunken]="!isSelected(day) && !isDateDisabled(day)"
                    [class.text-ink]="!isSelected(day) && !isToday(day) && !isDateDisabled(day)"
                    [class.text-accent]="isToday(day) && !isSelected(day)"
                    [class.font-bold]="isToday(day)"
                    [class.opacity-30]="isDateDisabled(day)"
                    [class.cursor-not-allowed]="isDateDisabled(day)"
                    [class.line-through]="isDateDisabled(day)"
                  >
                    {{ day }}
                    @if (isToday(day) && !isSelected(day)) {
                      <span class="absolute bottom-1 w-1 h-1 rounded-full bg-accent"></span>
                    }
                  </button>
                }
              </div>
            </div>
          }
        </div>
      }

      <!-- Backdrop -->
      @if (isOpen()) {
        <div class="fixed inset-0 z-40" (click)="closeCalendar()"></div>
      }
    </div>
  `,
})
export class DatePickerComponent implements ControlValueAccessor {
  value = signal<string | null>(null); // YYYY-MM-DD
  isOpen = signal(false);
  view = signal<'days' | 'months'>('months');

  // Calendar State
  displayDate = signal(new Date());

  ts = inject(TranslationService);

  weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  currentYear = computed(() => this.displayDate().getFullYear());
  currentMonthName = computed(() => {
    return this.displayDate().toLocaleString(this.ts.currentLang() === 'es' ? 'es-ES' : 'en-US', {
      month: 'long',
    });
  });

  currentMonthIndex = computed(() => this.displayDate().getMonth());

  daysInMonth = computed(() => {
    const year = this.currentYear();
    const month = this.displayDate().getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: days }, (_, i) => i + 1);
  });

  emptyDays = computed(() => {
    const year = this.currentYear();
    const month = this.displayDate().getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    return Array.from({ length: firstDay }, (_, i) => i);
  });

  formattedDate = computed(() => {
    if (!this.value()) return '';
    const [y, m, d] = this.value()!.split('-');
    const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    return date.toLocaleDateString(this.ts.currentLang() === 'es' ? 'es-ES' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  });

  onChange: any = () => {};
  onTouched: any = () => {};

  writeValue(val: string): void {
    if (val) {
      this.value.set(val);
      const [y, m, d] = val.split('-');
      this.displayDate.set(new Date(parseInt(y), parseInt(m) - 1, parseInt(d)));
    } else {
      this.value.set(null);
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  toggleCalendar() {
    this.isOpen.update((v) => !v);
    if (this.isOpen()) {
      this.view.set('months');
    }
  }

  closeCalendar() {
    this.isOpen.set(false);
  }

  setView(view: 'days' | 'months') {
    this.view.set(view);
  }

  changeYear(delta: number) {
    const current = this.displayDate();
    this.displayDate.set(new Date(current.getFullYear() + delta, current.getMonth(), 1));
  }

  changeMonthDayView(delta: number) {
    const current = this.displayDate();
    this.displayDate.set(new Date(current.getFullYear(), current.getMonth() + delta, 1));
  }

  selectMonth(monthIndex: number) {
    const current = this.displayDate();
    this.displayDate.set(new Date(current.getFullYear(), monthIndex, 1));
    this.view.set('days');
  }

  selectDate(day: number) {
    const year = this.currentYear();
    const month = (this.currentMonthIndex() + 1).toString().padStart(2, '0');
    const d = day.toString().padStart(2, '0');
    const dateString = `${year}-${month}-${d}`;

    this.value.set(dateString);
    this.onChange(dateString);
    this.closeCalendar();
  }

  isSelected(day: number): boolean {
    if (!this.value()) return false;
    const [y, m, d] = this.value()!.split('-');
    return (
      parseInt(y) === this.currentYear() &&
      parseInt(m) - 1 === this.currentMonthIndex() &&
      parseInt(d) === day
    );
  }

  isToday(day: number): boolean {
    const today = new Date();
    return (
      today.getFullYear() === this.currentYear() &&
      today.getMonth() === this.currentMonthIndex() &&
      today.getDate() === day
    );
  }

  isPastYear(year: number): boolean {
    const today = new Date();
    return year < today.getFullYear();
  }

  isPastMonth(monthIndex: number): boolean {
    const today = new Date();
    if (this.currentYear() < today.getFullYear()) return true;
    if (this.currentYear() === today.getFullYear()) {
      return monthIndex < today.getMonth();
    }
    return false;
  }

  isDateDisabled(day: number): boolean {
    const today = new Date();
    const date = new Date(this.currentYear(), this.currentMonthIndex(), day);
    today.setHours(0, 0, 0, 0);
    return date < today;
  }
}
