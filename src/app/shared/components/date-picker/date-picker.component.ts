import {
  Component,
  forwardRef,
  signal,
  computed,
  ElementRef,
  HostListener,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TranslationService } from '../../../core/services/translation.service';

@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [],
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
        class="flex items-center justify-between w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 cursor-pointer hover:border-primary/50 transition-colors group"
        (click)="toggleCalendar()"
      >
        <span [class.text-gray-400]="!value()" [class.text-gray-900]="value()" [class.dark:text-white]="value()">
          {{ formattedDate() || 'Select Date' }}
        </span>
        <span class="material-icons-outlined text-gray-400 group-hover:text-primary ml-3">calendar_today</span>
      </div>

      <!-- Calendar Dropdown -->
      @if (isOpen()) {
        <div
          class="absolute top-full left-0 mt-2 w-full min-w-[300px] bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-200 dark:border-white/10 p-4 z-50 animate-scale-in origin-top-left"
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
                        class="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full text-white dark:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <span class="material-icons-outlined text-sm font-bold">chevron_left</span>
                    </button>
  
                    <span class="text-xl font-bold text-gray-900 dark:text-white">
                        {{ currentYear() }}
                    </span>
  
                    <button
                        type="button"
                        (click)="changeYear(1)"
                        class="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full text-white dark:text-white"
                    >
                        <span class="material-icons-outlined text-sm font-bold">chevron_right</span>
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
                          [class.text-white]="currentMonthIndex() === i"
                          [class.shadow-lg]="currentMonthIndex() === i"
                          [class.shadow-primary/40]="currentMonthIndex() === i"
                          [class.text-gray-500]="currentMonthIndex() !== i && !isPastMonth(i)"
                          [class.dark:text-gray-400]="currentMonthIndex() !== i && !isPastMonth(i)"
                          [class.hover:bg-gray-50]="currentMonthIndex() !== i && !isPastMonth(i)"
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
                         class="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-400 dark:text-gray-400 font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-xs"
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
                        class="p-1 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg text-gray-500 dark:text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <span class="material-icons-outlined">chevron_left</span>
                    </button>
                    
                    <button 
                        type="button" 
                        (click)="setView('months')"
                        class="font-bold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 px-3 py-1 rounded-lg transition-colors"
                    >
                        {{ currentMonthName() }} {{ currentYear() }}
                    </button>
  
                    <button
                        type="button"
                        (click)="changeMonthDayView(1)"
                        class="p-1 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg text-gray-500 dark:text-gray-400"
                    >
                        <span class="material-icons-outlined">chevron_right</span>
                    </button>
                </div>
  
                <!-- Week Days -->
                <div class="grid grid-cols-7 mb-2">
                    @for (day of weekDays; track day) {
                      <div
                          class="text-xs font-semibold text-center text-gray-400 uppercase"
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
                          [class.text-white]="isSelected(day)"
                          [class.shadow-lg]="isSelected(day)"
                          [class.shadow-primary/30]="isSelected(day)"
                          [class.hover:bg-gray-100]="!isSelected(day) && !isDateDisabled(day)"
                          [class.dark:hover:bg-white/5]="!isSelected(day) && !isDateDisabled(day)"
                          [class.text-gray-700]="!isSelected(day) && !isToday(day) && !isDateDisabled(day)"
                          [class.dark:text-gray-300]="!isSelected(day) && !isToday(day) && !isDateDisabled(day)"
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
