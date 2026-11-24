import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../atoms/button.component';
import { IconComponent } from '../atoms/icon.component';

@Component({
  selector: 'ui-pagination',
  standalone: true,
  imports: [CommonModule, ButtonComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav
      aria-label="Pagination"
      class="flex items-center justify-between gap-3 py-3 w-full"
    >
      <button
        uiButton
        variant="secondary"
        size="sm"
        type="button"
        [disabled]="page() <= 0"
        (click)="goTo(page() - 1)"
        aria-label="Previous page"
      >
        <ui-icon name="chevron_left" size="sm" class="mr-1" />
        <span>{{ prevLabel() }}</span>
      </button>

      <span class="text-sm font-medium text-fg-muted tabular-nums select-none">
        {{ page() + 1 }} / {{ totalPages() > 0 ? totalPages() : 1 }}
      </span>

      <button
        uiButton
        variant="secondary"
        size="sm"
        type="button"
        [disabled]="page() >= totalPages() - 1 || totalPages() <= 0"
        (click)="goTo(page() + 1)"
        aria-label="Next page"
      >
        <span>{{ nextLabel() }}</span>
        <ui-icon name="chevron_right" size="sm" class="ml-1" />
      </button>
    </nav>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class PaginationComponent {
  page = input<number>(0);
  totalPages = input.required<number>();
  prevLabel = input<string>('Anterior');
  nextLabel = input<string>('Siguiente');

  pageChange = output<number>();

  goTo(target: number): void {
    const total = this.totalPages();
    if (total <= 0) return;
    const clamped = Math.max(0, Math.min(total - 1, target));
    if (clamped !== this.page()) {
      this.pageChange.emit(clamped);
    }
  }
}
