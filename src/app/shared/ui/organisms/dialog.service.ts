import { Injectable, Type, inject } from '@angular/core';
import { Dialog, DialogConfig, DialogRef } from '@angular/cdk/dialog';
import { firstValueFrom } from 'rxjs';
import { ConfirmDialogComponent, ConfirmDialogData } from './confirm-dialog.component';

export interface UiDialogConfig<D = unknown> {
  data?: D;
  size?: 'sm' | 'md' | 'lg';
  sheetOnMobile?: boolean;
  disableClose?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class UiDialogService {
  private cdkDialog = inject(Dialog);

  open<C, D = unknown, R = unknown>(
    component: Type<C>,
    config?: UiDialogConfig<D>
  ): DialogRef<R, C> {
    const size = config?.size ?? 'md';

    const sizeClassMap: Record<'sm' | 'md' | 'lg', string> = {
      sm: 'max-w-sm',
      md: 'max-w-lg',
      lg: 'max-w-2xl',
    };

    const isSheet = config?.sheetOnMobile ?? false;

    const panelClass = isSheet
      ? ['ui-dialog-panel', 'ui-sheet-mobile', sizeClassMap[size]]
      : ['ui-dialog-panel', 'w-full', sizeClassMap[size], 'p-4'];

    const cdkConfig: DialogConfig<D, DialogRef<R, C>> = {
      data: config?.data,
      disableClose: config?.disableClose ?? false,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-dark-backdrop',
      panelClass,
      autoFocus: 'first-tabbable',
      restoreFocus: true,
    };

    return this.cdkDialog.open<R, D, C>(component, cdkConfig);
  }

  async confirm(opts: ConfirmDialogData): Promise<boolean> {
    const ref = this.open(ConfirmDialogComponent, {
      data: opts,
      size: 'sm',
      disableClose: false,
    });

    const result = await firstValueFrom(ref.closed);
    return result === true;
  }
}
