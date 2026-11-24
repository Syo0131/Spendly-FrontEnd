import { Component, ChangeDetectionStrategy, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { ButtonComponent } from '../atoms/button.component';
import { IconComponent } from '../atoms/icon.component';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  tone?: 'danger' | 'primary';
}

@Component({
  selector: 'ui-confirm-dialog',
  standalone: true,
  imports: [CommonModule, ButtonComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      role="alertdialog"
      aria-modal="true"
      [attr.aria-label]="data.title"
      class="w-full max-w-sm bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden p-6 text-center space-y-4"
    >
      <div
        class="w-12 h-12 rounded-full mx-auto flex items-center justify-center"
        [class]="iconContainerClasses()"
      >
        <ui-icon [name]="iconName()" size="lg" />
      </div>

      <div class="space-y-1.5">
        <h3 class="font-bold text-lg text-ink tracking-tight">{{ data.title }}</h3>
        <p class="text-xs text-ink-muted leading-relaxed">{{ data.message }}</p>
      </div>

      <div class="flex items-center justify-center gap-3 pt-2">
        <button
          type="button"
          uiButton
          variant="secondary"
          (click)="cancel()"
        >
          {{ data.cancelLabel }}
        </button>

        <button
          type="button"
          uiButton
          [variant]="data.tone === 'primary' ? 'primary' : 'danger'"
          data-testid="confirm-button"
          (click)="confirm()"
        >
          {{ data.confirmLabel }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class ConfirmDialogComponent {
  dialogRef = inject(DialogRef<boolean>);
  data = inject<ConfirmDialogData>(DIALOG_DATA, { optional: true }) ?? {
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    tone: 'danger',
  };

  @HostListener('window:keydown.escape')
  onEscape(): void {
    this.cancel();
  }

  confirm(): void {
    this.dialogRef.close(true);
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  iconContainerClasses(): string {
    return this.data.tone === 'primary'
      ? 'bg-accent/15 text-accent'
      : 'bg-expense/15 text-expense';
  }

  iconName(): string {
    return this.data.tone === 'primary' ? 'help_outline' : 'warning';
  }
}

