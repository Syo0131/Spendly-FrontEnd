import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../core/services/translation.service';

@Component({
  selector: 'app-recurring',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6 animate-fade-in-up">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">
        {{ ts.t()('recurring.title') }}
      </h1>
      <div class="glass-card p-8 text-center text-gray-500 dark:text-gray-400">
        <span class="material-icons-outlined text-6xl mb-4 text-rose-500">replay</span>
        <p class="text-lg">{{ ts.t()('recurring.desc') }}</p>
      </div>
    </div>
  `,
})
export class RecurringComponent {
  constructor(public ts: TranslationService) {}
}
