import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-list-row',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (interactive()) {
      <button
        type="button"
        (click)="rowClick.emit($event)"
        class="w-full text-left rounded-xl p-3 sm:p-3.5 bg-surface-card border border-border-subtle transition-colors cursor-pointer hover:bg-surface-muted/60 active:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring group"
      >
        <div class="flex items-center gap-3 w-full">
          <div class="shrink-0 empty:hidden">
            <ng-content select="[uiRowLeading]" />
          </div>
          <div class="flex-1 min-w-0">
            <ng-content />
          </div>
          <div class="shrink-0 text-right empty:hidden">
            <ng-content select="[uiRowTrailing]" />
          </div>
        </div>
        <div class="w-full mt-2 empty:hidden">
          <ng-content select="[uiRowBelow]" />
        </div>
      </button>
    } @else {
      <div
        class="w-full rounded-xl p-3 sm:p-3.5 bg-surface-card border border-border-subtle"
      >
        <div class="flex items-center gap-3 w-full">
          <div class="shrink-0 empty:hidden">
            <ng-content select="[uiRowLeading]" />
          </div>
          <div class="flex-1 min-w-0">
            <ng-content />
          </div>
          <div class="shrink-0 text-right empty:hidden">
            <ng-content select="[uiRowTrailing]" />
          </div>
        </div>
        <div class="w-full mt-2 empty:hidden">
          <ng-content select="[uiRowBelow]" />
        </div>
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class ListRowComponent {
  interactive = input<boolean>(false);
  rowClick = output<MouseEvent>();
}
