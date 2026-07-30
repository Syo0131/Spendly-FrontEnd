import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../core/services/translation.service';
import { ThemeService } from '../../core/services/theme.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet, CommonModule, IconComponent],
  template: `
    <div
      class="min-h-screen bg-surface flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300"
    >
      <!-- Floating Header (Theme & Lang) -->
      <div class="absolute top-6 right-6 z-50 flex items-center space-x-3">
        <!-- Theme Toggle -->
        <button
          (click)="themeService.toggleTheme()"
          class="flex items-center justify-center w-10 h-10 rounded-full bg-surface-2/70 hover:bg-surface-2 border border-divider backdrop-blur-md transition-all text-content-muted hover:text-primary shadow-sm"
          [title]="themeService.darkMode() ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
        >
          <app-icon [name]="themeService.darkMode() ? 'light_mode' : 'dark_mode'" [size]="22" />
        </button>

        <!-- Lang Switcher -->
        <button
          (click)="ts.toggleLang()"
          class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-2/70 hover:bg-surface-2 border border-divider backdrop-blur-md transition-all text-sm font-medium text-content-muted hover:text-primary group shadow-sm"
        >
          <app-icon
            name="translate"
            [size]="18"
            class="group-hover:text-primary transition-colors"
          />
          <span>{{ ts.currentLang() === 'es' ? 'ES' : 'EN' }}</span>
        </button>
      </div>

      <!-- Background Blobs (warm terracotta wash) -->
      <div
        class="absolute top-0 left-0 w-96 h-96 bg-primary/15 rounded-full blur-[128px] -translate-x-1/2 -translate-y-1/2"
      ></div>
      <div
        class="absolute bottom-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[128px] translate-x-1/2 translate-y-1/2"
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
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [],
})
export class AuthLayoutComponent {
  constructor(public ts: TranslationService, public themeService: ThemeService) {}
}
