import { Injectable, inject } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs/operators';
import { NotificationService } from './notification.service';
import { TranslationService } from './translation.service';

@Injectable({
  providedIn: 'root',
})
export class UpdateService {
  private swUpdate = inject(SwUpdate);
  private ns = inject(NotificationService);
  private ts = inject(TranslationService);

  constructor() {
    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates
        .pipe(filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'))
        .subscribe(() => {
          this.promptUser();
        });
    }
  }

  private promptUser() {
    this.ns.show(
      this.ts.t()('notif.update_available') || 'New version available',
      'info',
      5000 // Show for longer
    );

    // We can add a custom action logic to NotificationService later,
    // but for now, showing the toast + allowing a manual reload via a separate mechanism
    // or just relying on the user to reload is the first step.
    // Ideally, we want a clickable action.
    // Since our current Toast component is simple, let's auto-reload or add a dedicated UI in future.
    // Wait, the user asked for "click to reload".
    // Our ToastComponent implementation needs to support actions?
    // Let's re-verify ToastComponent capabilities.
    // If not, I'll modify ToastComponent or just use a window.confirm for now to ensure functionality
    // OR simply reload if the user clicks the toast (if toast is clickable).

    // Actually, looking at previous toasts, they are just messages.
    // Let's implement a simple `confirm` for now or better:
    // Modifying the toast to accept an onClick action would be ideal but out of scope?
    // Let's look at `ToastComponent` source first.
  }
}
