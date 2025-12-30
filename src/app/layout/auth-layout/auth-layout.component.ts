import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../core/services/translation.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  template: `
    <div
      class="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300"
    >
      <!-- Floating Header (Theme & Lang) -->
      <div class="absolute top-6 right-6 z-50 flex items-center space-x-3">
        <!-- Theme Toggle -->
        <button
          (click)="themeService.toggleTheme()"
          class="flex items-center justify-center w-10 h-10 rounded-full bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 border border-gray-200 dark:border-white/5 backdrop-blur-md transition-all text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-white shadow-sm"
          [title]="themeService.darkMode() ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
        >
          <span class="material-icons-outlined text-xl">{{
            themeService.darkMode() ? 'light_mode' : 'dark_mode'
          }}</span>
        </button>

        <!-- Lang Switcher -->
        <button
          (click)="ts.toggleLang()"
          class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 border border-gray-200 dark:border-white/5 backdrop-blur-md transition-all text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-white group shadow-sm"
        >
          <span class="material-icons-outlined text-base group-hover:text-primary transition-colors"
            >translate</span
          >
          <span>{{ ts.currentLang() === 'es' ? 'ES' : 'EN' }}</span>
        </button>
      </div>

      <!-- Background Blobs -->
      <div
        class="absolute top-0 left-0 w-96 h-96 bg-primary/30 rounded-full blur-[128px] -translate-x-1/2 -translate-y-1/2 animate-pulse"
      ></div>
      <div
        class="absolute bottom-0 right-0 w-96 h-96 bg-secondary/20 rounded-full blur-[128px] translate-x-1/2 translate-y-1/2 animate-pulse"
      ></div>

      <!-- Content -->
      <div
        class="w-full max-w-md relative z-10 transition-all duration-150 transform"
        [class.opacity-0]="ts.isTransitioning()"
        [class.opacity-100]="!ts.isTransitioning()"
        [class.scale-95]="ts.isTransitioning()"
      >
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [],
})
export class AuthLayoutComponent {
  constructor(public ts: TranslationService, public themeService: ThemeService) {}
}
