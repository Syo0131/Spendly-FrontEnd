import { Injectable, inject, NgZone } from '@angular/core';
import { ApiService } from './api.service';
import { NotificationService } from './notification.service';
import { TranslationService } from './translation.service';
import { RemindersResponseDto } from '../models/api.models';
import { interval, Subscription, switchMap, catchError, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AlertService {
  private api = inject(ApiService);
  private ns = inject(NotificationService);
  private ts = inject(TranslationService);
  private ngZone = inject(NgZone);

  private pollingSub: Subscription | null = null;
  private processedReminders = new Set<number>();
  private readonly POLLING_INTERVAL = 10000; // 10 seconds

  constructor() {}

  init() {
    if (this.pollingSub) return;

    // Run outside Angular to avoid constant change detection cycles
    this.ngZone.runOutsideAngular(() => {
      this.pollingSub = interval(this.POLLING_INTERVAL)
        .pipe(
          switchMap(() => {
            // Fetch upcoming reminders (page 0, size 50, sorted by date asc)
            return this.api.getReminders(0, 50).pipe(
              catchError(() => of(null)) // Handle errors silently
            );
          })
        )
        .subscribe((response) => {
          if (response && response.content) {
            this.ngZone.run(() => {
              this.checkReminders(response.content);
            });
          }
        });
    });
  }

  stop() {
    if (this.pollingSub) {
      this.pollingSub.unsubscribe();
      this.pollingSub = null;
    }
  }

  private checkReminders(reminders: RemindersResponseDto[]) {
    const now = new Date();

    reminders.forEach((reminder) => {
      if (!reminder.remindAt) return;

      const reminderTime = new Date(reminder.remindAt);

      const diffInfo = this.getTimeDifference(now, reminderTime);

      // Criteria:
      // 1. Not already processed within this session
      // 2. Time is reached (diffMinutes <= 0)
      // 3. Not too old (e.g., within last 15 minutes) - prevents spamming old alerts on login
      if (!this.processedReminders.has(reminder.id) && diffInfo.isDue) {
        this.triggerAlert(reminder);
      }
    });

    // Optional: Cleanup old processed IDs to save memory?
    // For now, session lifecycle is fine.
  }

  private getTimeDifference(now: Date, target: Date) {
    const diffMs = target.getTime() - now.getTime();
    const diffMinutes = diffMs / (1000 * 60);

    // Consider "Due" if difference is <= 0 (present/past) AND > -15 (recent past)
    // Positive diffMinutes means future (not due yet).
    const isDue = diffMinutes <= 0 && diffMinutes > -15;

    return { diffMinutes, isDue };
  }

  private triggerAlert(reminder: RemindersResponseDto) {
    this.processedReminders.add(reminder.id);

    const title = this.ts.translate('alert.reminder_due');
    const message = `${title}: ${reminder.title || reminder.message}`;

    this.ns.show(message, 'info', 8000); // Show for 8 seconds

    // Play system sound if possible (Browser policy restricts audio context without interaction, but simple beep might not work)
    // For now, sticking to UI notification.
  }
}
