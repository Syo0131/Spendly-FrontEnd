import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  darkMode = signal<boolean>(true);

  constructor() {
    // Initialize from local storage or system preference
    const stored = localStorage.getItem('theme');
    if (stored) {
      this.darkMode.set(stored === 'dark');
    } else {
      // Default to Dark Mode as requested
      this.darkMode.set(true);
    }

    // Effect to apply class upon change
    effect(() => {
      const isDark = this.darkMode();
      if (isDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    });
  }

  toggleTheme() {
    this.darkMode.update((d) => !d);
  }
}
