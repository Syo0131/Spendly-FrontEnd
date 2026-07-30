import {
  Component,
  forwardRef,
  signal,
  computed,
  ElementRef,
  HostListener,
  inject,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TranslationService } from '../../../core/services/translation.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [IconComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatePickerComponent),
      multi: true,
    },
  ],
  template: `
    <div class="relative">
      <!-- Input Field -->
      <div
        class="flex items-center justify-between w-full bg-surface-3 border border-divider rounded-xl px-4 py-2.5 cursor-pointer hover:border-primary/50 transition-colors group"
        (click)="toggleCalendar()"
      >
        <span [class.text-content-subtle]="!value()" [class.text-content]="value()">
          {{ formattedDate() || 'Select Date' }}
        </span>
        <app-icon name="calendar_today" [size]="20" class="text-content-subtle group-hover:text-primary ml-3" />
      </div>

      <!-- Calendar Dropdown -->
      @if (isOpen()) {
        <div
          class="absolute top-full left-0 mt-2 w-full min-w-[300px] bg-surface-2 rounded-2xl shadow-xl border border-divider p-4 z-50 animate-scale-in origin-top-left"
        >
          <!-- MONTH VIEW (Year Selector + Month Grid) -->
          @if (view() === 'months') {
            <ng-container>
                <!-- Year Header -->
                <div class="flex items-center justify-between mb-4 px-2">
                    <button
                        type="button"
                        (click)="changeYear(-1)"
                        [disabled]="isPastYear(currentYear() - 1)"
                        class="p-2 hover:bg-surface-3 rounded-full text-content disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <app-icon name="chevron_left" [size]="18" />
                    </button>
  
                    <span class="text-xl font-bold text-content">
                        {{ currentYear() }}
                    </span>
  
                    <button
                        type="button"
                        (click)="changeYear(1)"
                        class="p-2 hover:bg-surface-3 rounded-full text-content"
                    >
                        <app-icon name="chevron_right" [size]="18" />
                    </button>
                </div>
  
                <!-- Months Grid -->
                <div class="grid grid-cols-3 gap-3 mb-4">
                    @for (month of months; track $index; let i = $index) {
                      <button
                          (click)="selectMonth(i)"
                          [disabled]="isPastMonth(i)"
                          class="p-3 rounded-xl text-sm font-medium transition-all relative overflow-hidden"
                          [class.bg-primary]="currentMonthIndex() === i"
                          [class.text-primary-on]="currentMonthIndex() === i"
                          [class.shadow-lg]="currentMonthIndex() === i"
                          [class.shadow-primary/40]="currentMonthIndex() === i"
                          [class.text-content-muted]="currentMonthIndex() !== i && !isPastMonth(i)"
                          [class.dark:text-content-subtle]="currentMonthIndex() !== i && !isPastMonth(i)"
                          [class.hover:bg-surface-3]="currentMonthIndex() !== i && !isPastMonth(i)"
                          [class.dark:hover:bg-white/5]="currentMonthIndex() !== i && !isPastMonth(i)"
                          [class.opacity-30]="isPastMonth(i)"
                          [class.cursor-not-allowed]="isPastMonth(i)"
                      >
                          {{ month }}
                      </button>
                    }
                </div>
  
                <!-- Actions (Optional, but helps to verify feeling) -->
                 <div class="flex gap-3">
                    <button
                        (click)="closeCalendar()"
                         class="flex-1 py-2.5 rounded-xl border border-divider text-content-subtle dark:text-content-subtle font-medium hover:bg-surface-3 transition-colors text-xs"
                    >
                        Cancel
                    </button>
                </div>
            </ng-container>
          }
  
          <!-- DAY VIEW -->
          @if (view() === 'days') {
            <ng-container>
                <!-- Header -->
                <div class="flex items-center justify-between mb-4">
                    <button
                        type="button"
                        (click)="changeMonthDayView(-1)"
                        [disabled]="isPastMonth(currentMonthIndex() - 1)" 
                        class="p-1 hover:bg-surface-3 rounded-lg text-content-muted disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <app-icon name="chevron_left" [size]="24" />
                    </button>
                    
                    <button 
                        type="button" 
                        (click)="setView('months')"
                        class="font-bold text-content hover:bg-surface-3 px-3 py-1 rounded-lg transition-colors"
                    >
                        {{ currentMonthName() }} {{ currentYear() }}
                    </button>
  
                    <button
                        type="button"
                        (click)="changeMonthDayView(1)"
                        class="p-1 hover:bg-surface-3 rounded-lg text-content-muted"
                    >
                        <app-icon name="chevron_right" [size]="24" />
                    </button>
                </div>
  
                <!-- Week Days -->
                <div class="grid grid-cols-7 mb-2">
                    @for (day of weekDays; track day) {
                      <div
                          class="text-xs font-semibold text-center text-content-subtle uppercase"
                      >
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
                          class="h-9 rounded-lg text-sm font-medium flex items-center justify-center transition-colors relative"
                          [class.bg-primary]="isSelected(day)"
                          [class.text-primary-on]="isSelected(day)"
                          [class.shadow-lg]="isSelected(day)"
                          [class.shadow-primary/30]="isSelected(day)"
                          [class.hover:bg-surface-3]="!isSelected(day) && !isDateDisabled(day)"
                          [class.dark:hover:bg-white/5]="!isSelected(day) && !isDateDisabled(day)"
                          [class.text-content-muted]="!isSelected(day) && !isToday(day) && !isDateDisabled(day)"
                          [class.dark:text-content-subtle]="!isSelected(day) && !isToday(day) && !isDateDisabled(day)"
                          [class.text-primary]="isToday(day) && !isSelected(day)"
                          [class.font-bold]="isToday(day)"
                          [class.opacity-30]="isDateDisabled(day)"
                          [class.cursor-not-allowed]="isDateDisabled(day)"
                          [class.line-through]="isDateDisabled(day)"
                      >
                          {{ day }}
                          @if (isToday(day)) {
                            <span class="absolute bottom-1 w-1 h-1 rounded-full bg-primary" [class.bg-white]="isSelected(day)"></span>
                          }
                      </button>
                    }
                </div>
            </ng-container>
          }
        </div>
      }

       <!-- Backdrop -->
       @if (isOpen()) {
         <div class="fixed inset-0 z-40" (click)="closeCalendar()"></div>
       }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [],
})
export class DatePickerComponent implements ControlValueAccessor {
  value = signal<string | null>(null); // YYYY-MM-DD
  isOpen = signal(false);
  view = signal<'days' | 'months'>('months'); // Default to 'months'

  // Calendar State
  displayDate = signal(new Date()); // Controls which month is shown

  ts = inject(TranslationService);

  weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Methods to calculate days
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

  // ControlValueAccessor
  onChange: any = () => {};
  onTouched: any = () => {};

  writeValue(val: string): void {
    if (val) {
      this.value.set(val);
      const [y, m, d] = val.split('-');
      this.displayDate.set(new Date(parseInt(y), parseInt(m) - 1, parseInt(d)));
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  // Logic
  toggleCalendar() {
    this.isOpen.update((v) => !v);
    if (this.isOpen()) {
      this.view.set('months');
    }
  }

  closeCalendar() {
    this.isOpen.set(false);
    this.onTouched();
  }

  setView(v: 'days' | 'months') {
    this.view.set(v);
  }

  selectMonth(index: number) {
    const newDate = new Date(this.displayDate());
    newDate.setMonth(index);
    this.displayDate.set(newDate);
    this.view.set('days');
  }

  changeMonthDayView(delta: number) {
    this.changeMonth(delta);
  }

  changeMonth(delta: number) {
    const newDate = new Date(this.displayDate());
    newDate.setMonth(newDate.getMonth() + delta);
    this.displayDate.set(newDate);
  }

  changeYear(delta: number) {
    const newDate = new Date(this.displayDate());
    const newYear = newDate.getFullYear() + delta;

    const currentYear = new Date().getFullYear();

    if (newYear < currentYear) return;
    if (newYear > currentYear + 10) return;

    newDate.setFullYear(newYear);

    // Prevent landing in a past month when changing year (e.g. going back to current year)
    const today = new Date();
    if (newYear === currentYear && newDate.getMonth() < today.getMonth()) {
      newDate.setMonth(today.getMonth());
    }

    this.displayDate.set(newDate);
  }

  isPastYear(year: number): boolean {
    return year < new Date().getFullYear();
  }

  isPastMonth(monthIndex?: number): boolean {
    const today = new Date();
    const currentDisplayYear = this.displayDate().getFullYear();
    const checkMonth = monthIndex !== undefined ? monthIndex : this.displayDate().getMonth();

    if (currentDisplayYear < today.getFullYear()) return true;
    if (currentDisplayYear === today.getFullYear() && checkMonth < today.getMonth()) return true;

    return false;
  }

  selectDate(day: number) {
    const year = this.currentYear();
    const month = this.displayDate().getMonth() + 1;

    const paddedMonth = month.toString().padStart(2, '0');
    const paddedDay = day.toString().padStart(2, '0');
    const isoDate = `${year}-${paddedMonth}-${paddedDay}`;

    this.value.set(isoDate);
    this.onChange(isoDate);
    this.closeCalendar();
  }

  isSelected(day: number): boolean {
    if (!this.value()) return false;
    const [y, m, d] = this.value()!.split('-');
    return (
      parseInt(d) === day &&
      parseInt(m) === this.displayDate().getMonth() + 1 &&
      parseInt(y) === this.currentYear()
    );
  }

  isDateDisabled(day: number): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkDate = new Date(this.currentYear(), this.displayDate().getMonth(), day);
    return checkDate < today;
  }

  isToday(day: number): boolean {
    const today = new Date();
    return (
      day === today.getDate() &&
      this.displayDate().getMonth() === today.getMonth() &&
      this.displayDate().getFullYear() === today.getFullYear()
    );
  }
}
