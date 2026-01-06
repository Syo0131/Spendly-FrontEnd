import { Injectable, inject, signal, NgZone } from '@angular/core';
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
  private ngZone = inject(NgZone);

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

      this.swUpdate.unrecoverable.subscribe((evt) => {
        console.error('UpdateService: Unrecoverable state', evt.reason);
        document.location.reload();
      });

      // Poll every 30 seconds (Outside Zone to avoid blocking app stability)
      this.ngZone.runOutsideAngular(() => {
        interval(30 * 1000).subscribe(() => {
          this.ngZone.run(() => this.checkForUpdate());
        });
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
    // Nuclear Option: Unregister SW to force fresh fetch on reload
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister();
      }
      // Reload with cache busting
      window.location.reload();
    });
  }
}
