import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from './auth.service';
import { ApiService } from './api.service';
import { NotificationService } from './notification.service';

function createToken(payload: object): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  const body = btoa(JSON.stringify(payload))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `${header}.${body}.signature`;
}

describe('AuthService getUserId', () => {
  let service: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: { navigate: () => {} } },
        { provide: ApiService, useValue: { checkPremiumStatus: () => of({ isPremium: false }) } },
        { provide: NotificationService, useValue: { clearHistory: () => {} } },
      ],
    });
    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('returns the userId claim when present in token', () => {
    const token = createToken({ userId: 42, exp: Math.floor(Date.now() / 1000) + 3600 });
    localStorage.setItem('spendly_token', token);
    expect((service as any).getUserId()).toBe(42);
  });

  it('returns null without a token', () => {
    localStorage.removeItem('spendly_token');
    expect((service as any).getUserId()).toBeNull();
  });

  it('returns null for a malformed token', () => {
    localStorage.setItem('spendly_token', 'abc');
    expect((service as any).getUserId()).toBeNull();
  });

  it('returns null when the claim is missing', () => {
    const token = createToken({ exp: Math.floor(Date.now() / 1000) + 3600 });
    localStorage.setItem('spendly_token', token);
    expect((service as any).getUserId()).toBeNull();
  });
});
