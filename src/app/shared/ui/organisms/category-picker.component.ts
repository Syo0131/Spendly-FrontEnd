import {
  Component,
  ChangeDetectionStrategy,
  input,
  signal,
  computed,
  forwardRef,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { OverlayModule } from '@angular/cdk/overlay';
import { Category } from '../../../core/models/api.models';
import { IconComponent } from '../atoms/icon.component';

@Component({
  selector: 'ui-category-picker',
  standalone: true,
  imports: [CommonModule, OverlayModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CategoryPickerComponent),
      multi: true,
    },
  ],
  template: `
    <div class="relative w-full">
      @if (label()) {
        <label class="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5 cursor-pointer" (click)="toggle()">
          {{ label() }}
        </label>
      }

      <!-- Trigger Button -->
      <button
        type="button"
        cdkOverlayOrigin
        #trigger="cdkOverlayOrigin"
        (click)="toggle()"
        [disabled]="disabled()"
        class="w-full h-10 px-3 rounded-md bg-surface border border-border text-ink text-sm flex items-center justify-between gap-2 shadow-sm transition-colors hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring disabled:opacity-50"
      >
        <div class="flex items-center gap-2 truncate">
          @if (selectedCategory(); as cat) {
            <span
              class="w-5 h-5 rounded flex items-center justify-center text-xs"
              [style.backgroundColor]="cat.color + '25'"
              [style.color]="cat.color"
            >
              <ui-icon [name]="cat.icons" size="sm" />
            </span>
            <span class="font-medium text-ink truncate">{{ cat.name }}</span>
          } @else {
            <span class="text-ink-subtle">{{ placeholder() }}</span>
          }
        </div>
        <ui-icon name="expand_more" size="sm" class="text-ink-muted transition-transform duration-150" [class.rotate-180]="isOpen()" />
      </button>

      <!-- Overlay Dropdown -->
      <ng-template
        cdkConnectedOverlay
        [cdkConnectedOverlayOrigin]="trigger"
        [cdkConnectedOverlayOpen]="isOpen()"
        [cdkConnectedOverlayHasBackdrop]="true"
        cdkConnectedOverlayBackdropClass="cdk-overlay-transparent-backdrop"
        (backdropClick)="close()"
        (detach)="close()"
      >
        <div
          role="listbox"
          [attr.aria-label]="label() || placeholder()"
          class="w-[280px] sm:w-[320px] max-h-60 overflow-y-auto bg-surface-raised border border-border rounded-lg shadow-xl p-1 text-sm z-50 animate-scale-in"
        >
          @for (cat of categories(); track cat.id; let idx = $index) {
            <div
              role="option"
              [attr.aria-selected]="selectedId() === cat.id"
              (click)="selectCategory(cat)"
              class="flex items-center justify-between px-3 py-2 rounded cursor-pointer transition-colors"
              [class.bg-accent-light]="highlightedIndex() === idx"
              [class.text-accent]="highlightedIndex() === idx"
              [class.bg-surface-sunken]="selectedId() === cat.id && highlightedIndex() !== idx"
            >
              <div class="flex items-center gap-2.5 truncate">
                <span
                  class="w-6 h-6 rounded flex items-center justify-center text-xs"
                  [style.backgroundColor]="cat.color + '25'"
                  [style.color]="cat.color"
                >
                  <ui-icon [name]="cat.icons" size="sm" />
                </span>
                <span class="font-medium truncate">{{ cat.name }}</span>
              </div>
              @if (selectedId() === cat.id) {
                <ui-icon name="check" size="sm" class="text-accent flex-shrink-0" />
              }
            </div>
          }
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class CategoryPickerComponent implements ControlValueAccessor {
  categories = input<Category[]>([]);
  placeholder = input<string>('Select category');
  label = input<string>('');

  selectedId = signal<number | null>(null);
  isOpen = signal<boolean>(false);
  disabled = signal<boolean>(false);
  highlightedIndex = signal<number>(0);

  private onChange: (value: number | null) => void = () => {};
  private onTouched: () => void = () => {};

  selectedCategory = computed(() => {
    const id = this.selectedId();
    if (id === null) return null;
    return this.categories().find((c) => c.id === id) ?? null;
  });

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    if (!this.isOpen()) return;

    const cats = this.categories();
    if (cats.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.highlightedIndex.update((curr) => (curr + 1) % cats.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.highlightedIndex.update((curr) => (curr - 1 + cats.length) % cats.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const target = cats[this.highlightedIndex()];
      if (target) {
        this.selectCategory(target);
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
    }
  }

  open(): void {
    if (this.disabled()) return;
    const cats = this.categories();
    const currentIdx = cats.findIndex((c) => c.id === this.selectedId());
    this.highlightedIndex.set(currentIdx >= 0 ? currentIdx : 0);
    this.isOpen.set(true);
  }

  close(): void {
    if (!this.isOpen()) return;
    this.isOpen.set(false);
    this.onTouched();
  }

  toggle(): void {
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  selectCategory(category: Category): void {
    this.selectedId.set(category.id);
    this.onChange(category.id);
    this.close();
  }

  writeValue(value: number | null): void {
    this.selectedId.set(value);
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
