import { describe, it, expect } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { MainLayoutComponent } from './main-layout.component';
import { AuthService } from '../../core/services/auth.service';
import { TranslationService } from '../../core/services/translation.service';
import { NotificationService } from '../../core/services/notification.service';
import { UpdateService } from '../../core/services/update.service';
import { DataPreloadService } from '../../core/services/data-preload.service';
import { AlertService } from '../../core/services/alert.service';
import { signal } from '@angular/core';

describe('MainLayoutComponent', () => {
  let fixture: ComponentFixture<MainLayoutComponent>;
  let component: MainLayoutComponent;

  const mockAuthService = {
    currentUserStr: signal('Daybel'),
    logout: () => {},
  };

  const mockTranslationService = {
    t: () => (key: string) => key,
    translate: (msg: string) => msg,
  };

  const mockNotificationService = {
    unreadCount: signal(0),
    history: signal([]),
    toasts: signal([]),
    markAllAsRead: () => {},
    clearHistory: () => {},
    dismissToast: () => {},
  };

  const mockUpdateService = {
    isUpdateAvailable: signal(false),
    reloadApp: () => {},
  };

  const mockPreloadService = {
    preloadAll: () => {},
  };

  const mockAlertService = {
    init: () => {},
    stop: () => {},
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MainLayoutComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: UpdateService, useValue: mockUpdateService },
        { provide: DataPreloadService, useValue: mockPreloadService },
        { provide: AlertService, useValue: mockAlertService },
      ],
    });

    fixture = TestBed.createComponent(MainLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders 5 bottom navigation tabs on mobile', () => {
    const bottomNav = fixture.debugElement.query(By.css('nav[aria-label="Navegación principal móvil"]'));
    expect(bottomNav).toBeTruthy();

    const links = bottomNav.queryAll(By.css('a'));
    expect(links.length).toBe(4); // Dashboard, Expenses, Incomes, Budgets
    const moreBtn = bottomNav.query(By.css('button[aria-label="Más opciones"]'));
    expect(moreBtn).toBeTruthy(); // 5th item: Más drawer trigger
  });

  it('opens and closes more action sheet', () => {
    expect(component.showMoreSheet()).toBe(false);

    const moreBtn = fixture.debugElement.query(By.css('button[aria-label="Más opciones"]'));
    moreBtn.nativeElement.click();
    fixture.detectChanges();

    expect(component.showMoreSheet()).toBe(true);

    // Escape closes the sheet
    component.handleEscape();
    fixture.detectChanges();

    expect(component.showMoreSheet()).toBe(false);
  });
});
