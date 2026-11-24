import { describe, it, expect } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { AuthLayoutComponent } from './auth-layout.component';
import { TranslationService } from '../../core/services/translation.service';
import { ThemeService } from '../../core/services/theme.service';
import { signal } from '@angular/core';

describe('AuthLayoutComponent', () => {
  let fixture: ComponentFixture<AuthLayoutComponent>;
  let component: AuthLayoutComponent;

  let dark = false;
  const mockThemeService = {
    darkMode: signal(false),
    toggleTheme: () => {
      dark = !dark;
      mockThemeService.darkMode.set(dark);
    },
  };

  let lang = 'es';
  const mockTranslationService = {
    currentLang: signal('es'),
    isTransitioning: signal(false),
    toggleLang: () => {
      lang = lang === 'es' ? 'en' : 'es';
      mockTranslationService.currentLang.set(lang);
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AuthLayoutComponent],
      providers: [
        provideRouter([]),
        { provide: ThemeService, useValue: mockThemeService },
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    });

    fixture = TestBed.createComponent(AuthLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders theme and language toggles with aria-labels', () => {
    const themeBtn = fixture.debugElement.query(By.css('button[aria-label="Cambiar a modo oscuro"]'));
    const langBtn = fixture.debugElement.query(By.css('button[aria-label="Cambiar idioma"]'));

    expect(themeBtn).toBeTruthy();
    expect(langBtn).toBeTruthy();

    themeBtn.nativeElement.click();
    expect(mockThemeService.darkMode()).toBe(true);

    langBtn.nativeElement.click();
    expect(mockTranslationService.currentLang()).toBe('en');
  });
});
