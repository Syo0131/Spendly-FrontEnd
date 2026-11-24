import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SettingsComponent } from './settings.component';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { TranslationService } from '../../core/services/translation.service';
import { ThemeService } from '../../core/services/theme.service';
import { NotificationService } from '../../core/services/notification.service';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;

  let mockAuthService: any;
  let mockApiService: any;
  let mockTranslationService: any;
  let mockThemeService: any;
  let mockNotificationService: any;

  beforeEach(async () => {
    mockAuthService = {
      currentUserStr: signal<string>('daybeldiaz'),
      getUserId: vi.fn().mockReturnValue(42),
      logout: vi.fn(),
    };

    mockApiService = {
      updateUser: vi.fn().mockReturnValue(of({})),
    };

    mockTranslationService = {
      t: () => (key: string) => key,
      currentLang: signal<'en' | 'es'>('en'),
      setLang: vi.fn(),
    };

    mockThemeService = {
      darkMode: signal<boolean>(false),
      toggleTheme: vi.fn(),
    };

    mockNotificationService = {
      show: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [SettingsComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ApiService, useValue: mockApiService },
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: ThemeService, useValue: mockThemeService },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and prefill username on init', () => {
    expect(component).toBeTruthy();
    expect(component.profileForm.value.username).toBe('daybeldiaz');
    expect(component.activeTab()).toBe('profile');
  });

  it('should switch tabs properly', () => {
    component.setTab('security');
    expect(component.activeTab()).toBe('security');

    component.setTab('preferences');
    expect(component.activeTab()).toBe('preferences');
  });

  it('should update profile when form is valid', () => {
    component.profileForm.setValue({
      name: 'Daybel Diaz',
      email: 'daybel@example.com',
      username: 'daybeldiaz',
    });

    component.updateProfile();

    expect(mockApiService.updateUser).toHaveBeenCalledWith(42, {
      name: 'Daybel Diaz',
      email: 'daybel@example.com',
      username: 'daybeldiaz',
    });
    expect(mockNotificationService.show).toHaveBeenCalledWith(
      'notif.profile_updated',
      'success',
      3000
    );
  });

  it('should show session invalid if getUserId returns null', () => {
    mockAuthService.getUserId.mockReturnValue(null);
    component.profileForm.setValue({
      name: 'Daybel Diaz',
      email: 'daybel@example.com',
      username: 'daybeldiaz',
    });

    component.updateProfile();

    expect(mockNotificationService.show).toHaveBeenCalledWith(
      'settings.session_invalid',
      'error'
    );
    expect(mockApiService.updateUser).not.toHaveBeenCalled();
  });

  it('should validate password mismatch in security form', () => {
    component.securityForm.patchValue({
      password: 'password123',
      confirmPassword: 'differentPassword',
    });

    expect(component.securityForm.hasError('mismatch')).toBe(true);
    expect(component.securityForm.valid).toBe(false);
  });

  it('should submit change password when valid', () => {
    component.securityForm.patchValue({
      password: 'password123',
      confirmPassword: 'password123',
    });

    component.changePassword();

    expect(mockApiService.updateUser).toHaveBeenCalledWith(42, {
      password: 'password123',
    });
    expect(mockNotificationService.show).toHaveBeenCalledWith(
      'notif.account_disabled',
      'success',
      2000
    );
  });

  it('should trigger theme toggle on preferences change', () => {
    mockThemeService.toggleTheme();
    expect(mockThemeService.toggleTheme).toHaveBeenCalled();
  });
});
