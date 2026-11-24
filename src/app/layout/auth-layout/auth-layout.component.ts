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
      class="min-h-screen bg-canvas text-ink flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300"
    >
      <!-- Floating Header (Theme & Lang Toggles) -->
      <div class="absolute top-6 right-6 z-50 flex items-center space-x-3">
        <!-- Theme Toggle -->
        <button
          type="button"
          (click)="themeService.toggleTheme()"
          [attr.aria-label]="themeService.darkMode() ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
          class="flex items-center justify-center w-10 h-10 rounded-full bg-surface-raised hover:bg-surface-sunken border border-border transition-colors text-ink-muted hover:text-ink shadow-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
        >
          <span class="material-icons-outlined text-xl select-none">{{
            themeService.darkMode() ? 'light_mode' : 'dark_mode'
          }}</span>
        </button>

        <!-- Lang Switcher -->
        <button
          type="button"
          (click)="ts.toggleLang()"
          aria-label="Cambiar idioma"
          class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-raised hover:bg-surface-sunken border border-border transition-colors text-xs font-semibold uppercase tracking-wider text-ink-muted hover:text-ink shadow-sm cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
        >
          <span class="material-icons-outlined text-base">translate</span>
          <span>{{ ts.currentLang() === 'es' ? 'ES' : 'EN' }}</span>
        </button>
      </div>

      <!-- Auth Card Viewport -->
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
})
export class AuthLayoutComponent {
  constructor(public ts: TranslationService, public themeService: ThemeService) {}
}
