import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../core/services/translation.service';

@Component({
  selector: 'app-reminders',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6 animate-fade-in-up">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">
        {{ ts.t()('reminders.title') }}
      </h1>
      <div class="glass-card p-8 text-center text-gray-500 dark:text-gray-400">
        <span class="material-icons-outlined text-6xl mb-4 text-purple-500">notifications</span>
        <p class="text-lg">{{ ts.t()('reminders.desc') }}</p>
      </div>
    </div>
  `,
})
export class RemindersComponent {
  constructor(public ts: TranslationService) {}
}
