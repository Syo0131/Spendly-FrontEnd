import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BanksComponent } from './banks.component';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { TranslationService } from '../../core/services/translation.service';
import { NotificationService } from '../../core/services/notification.service';
import { UiDialogService } from '../../shared/ui';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { BankOption } from '../../core/models/api.models';

describe('BanksComponent', () => {
  let component: BanksComponent;
  let fixture: ComponentFixture<BanksComponent>;

  const mockBanks: BankOption[] = [
    { code: 'POPULAR', displayName: 'Banco Popular', email: '' },
    { code: 'BHD', displayName: 'Banco BHD', email: '' },
  ];

  let mockAuthService: any;
  let mockApiService: any;
  let mockNotificationService: any;
  let mockDialogService: any;

  beforeEach(async () => {
    mockAuthService = {
      isPremium: signal<boolean>(false),
    };

    mockApiService = {
      getBanks: vi.fn().mockReturnValue(of(mockBanks)),
      getBankStatus: vi.fn().mockReturnValue(of(['POPULAR'])),
      authorizeBank: vi.fn().mockReturnValue(of({ authUrl: 'https://bank.com/oauth' })),
      disconnectBank: vi.fn().mockReturnValue(of({})),
    };

    mockNotificationService = {
      show: vi.fn(),
    };

    mockDialogService = {
      confirm: vi.fn().mockResolvedValue(true),
    };

    await TestBed.configureTestingModule({
      imports: [BanksComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ApiService, useValue: mockApiService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: UiDialogService, useValue: mockDialogService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BanksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load banks on init', () => {
    expect(component).toBeTruthy();
    expect(mockApiService.getBanks).toHaveBeenCalled();
    expect(component.banks().length).toBe(2);
  });

  it('should not check bank status if not premium', () => {
    expect(mockApiService.getBankStatus).not.toHaveBeenCalled();
  });

  it('should check bank status when premium is active', () => {
    mockAuthService.isPremium.set(true);
    component.checkStatus();
    expect(mockApiService.getBankStatus).toHaveBeenCalled();
    expect(component.isConnected('POPULAR')).toBe(true);
    expect(component.isConnected('BHD')).toBe(false);
  });

  it('should open WhatsApp link on contactViaWhatsApp', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    component.contactViaWhatsApp();
    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining('https://wa.me/?text='),
      '_blank'
    );
    openSpy.mockRestore();
  });

  it('should call authorizeBank when connecting a bank', () => {
    component.connectBank(mockBanks[1]);
    expect(mockApiService.authorizeBank).toHaveBeenCalledWith('BHD');
  });

  it('should confirm before disconnecting a bank', async () => {
    mockDialogService.confirm.mockResolvedValue(true);

    await component.disconnectBank(mockBanks[0]);

    expect(mockDialogService.confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        tone: 'danger',
      })
    );
    expect(mockApiService.disconnectBank).toHaveBeenCalledWith('POPULAR');
    expect(mockNotificationService.show).toHaveBeenCalled();
  });

  it('should not disconnect bank if user cancels confirmation', async () => {
    mockDialogService.confirm.mockResolvedValue(false);

    await component.disconnectBank(mockBanks[0]);

    expect(mockDialogService.confirm).toHaveBeenCalled();
    expect(mockApiService.disconnectBank).not.toHaveBeenCalled();
  });
});
