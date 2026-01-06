import { Injectable, inject, signal } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs/operators';
import { interval } from 'rxjs';
import { NotificationService } from './notification.service';
import { TranslationService } from './translation.service';

@Injectable({
  providedIn: 'root',
})
export class UpdateService {
  private swUpdate = inject(SwUpdate);
  private ns = inject(NotificationService);
  private ts = inject(TranslationService);

  isUpdateAvailable = signal(false);

  constructor() {
    if (this.swUpdate.isEnabled) {
      // Force check on load
      this.swUpdate.checkForUpdate().then(() => {
        console.log('UpdateService: Initial check completed');
      });

      this.swUpdate.versionUpdates
        .pipe(filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'))
        .subscribe(() => {
          console.log('UpdateService: New version ready');
          this.isUpdateAvailable.set(true);
        });

      // Poll every 30 seconds
      interval(30 * 1000).subscribe(() => {
        this.checkForUpdate();
      });

      // Check when coming back to the tab/app
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.checkForUpdate();
        }
      });
    }
  }

  checkForUpdate() {
    this.swUpdate
      .checkForUpdate()
      .then((hasUpdate) => {
        if (hasUpdate) {
          console.log('UpdateService: Update found via explicit check');
        }
      })
      .catch((err) => console.error('UpdateService: Failed to check for update', err));
  }

  reloadApp() {
    this.swUpdate.activateUpdate().then(() => {
      document.location.reload();
    });
  }
}
