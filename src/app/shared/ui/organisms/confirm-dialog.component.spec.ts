import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { DialogModule } from '@angular/cdk/dialog';
import { UiDialogService } from './dialog.service';
import { ConfirmDialogComponent } from './confirm-dialog.component';

describe('ConfirmDialogComponent & UiDialogService', () => {
  let dialogService: UiDialogService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogModule, ConfirmDialogComponent],
      providers: [UiDialogService],
    }).compileComponents();

    dialogService = TestBed.inject(UiDialogService);
  });

  it('confirm() resolves true when confirm button is clicked', async () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();

    const promise = dialogService.confirm({
      title: 'Delete Item?',
      message: 'Are you sure?',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      tone: 'danger',
    });

    await new Promise((r) => setTimeout(r, 30));

    const confirmBtn = document.querySelector('button[data-testid="confirm-button"]') as HTMLButtonElement;
    expect(confirmBtn).not.toBeNull();
    confirmBtn.click();

    const result = await promise;
    expect(result).toBe(true);

    await new Promise((r) => setTimeout(r, 30));
    expect(document.activeElement).toBe(trigger);

    trigger.remove();
  });

  it('confirm() resolves false on Escape keydown', async () => {
    const promise = dialogService.confirm({
      title: 'Delete Item?',
      message: 'Are you sure?',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
    });

    await new Promise((r) => setTimeout(r, 30));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    const result = await promise;
    expect(result).toBe(false);
  });
});
