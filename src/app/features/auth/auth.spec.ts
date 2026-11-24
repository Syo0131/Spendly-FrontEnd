import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { OAuthCallbackComponent } from './oauth-callback/oauth-callback.component';
import { AuthService } from '../../core/services/auth.service';
import { Router, ActivatedRoute, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

describe('Auth Features', () => {
  describe('LoginComponent', () => {
    let component: LoginComponent;
    let fixture: ComponentFixture<LoginComponent>;
    let mockAuthService: any;
    let router: Router;

    beforeEach(async () => {
      mockAuthService = {
        login: vi.fn().mockReturnValue(of({ token: 'abc' })),
      };

      await TestBed.configureTestingModule({
        imports: [LoginComponent],
        providers: [
          provideRouter([]),
          { provide: AuthService, useValue: mockAuthService },
        ],
      }).compileComponents();

      router = TestBed.inject(Router);
      vi.spyOn(router, 'navigate').mockResolvedValue(true);

      fixture = TestBed.createComponent(LoginComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should create and validate login form', () => {
      expect(component).toBeTruthy();
      expect(component.loginForm.valid).toBe(false);

      component.loginForm.setValue({ username: 'user1', password: 'password' });
      expect(component.loginForm.valid).toBe(true);
    });

    it('should submit login and navigate to dashboard on success', () => {
      component.loginForm.setValue({ username: 'user1', password: 'password' });
      component.onSubmit();

      expect(mockAuthService.login).toHaveBeenCalledWith({
        username: 'user1',
        password: 'password',
      });
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('should display error message on failed login', () => {
      mockAuthService.login.mockReturnValue(
        throwError(() => ({ error: { mensaje: 'Invalid credentials' } }))
      );

      component.loginForm.setValue({ username: 'user1', password: 'wrong' });
      component.onSubmit();

      expect(component.error()).toBe('Invalid credentials');
      expect(component.isLoading()).toBe(false);
    });

    it('should toggle password visibility', () => {
      expect(component.showPassword()).toBe(false);
      component.showPassword.set(true);
      expect(component.showPassword()).toBe(true);
    });
  });

  describe('RegisterComponent', () => {
    let component: RegisterComponent;
    let fixture: ComponentFixture<RegisterComponent>;
    let mockAuthService: any;
    let router: Router;

    beforeEach(async () => {
      mockAuthService = {
        register: vi.fn().mockReturnValue(of({ mensaje: 'User registered' })),
      };

      await TestBed.configureTestingModule({
        imports: [RegisterComponent],
        providers: [
          provideRouter([]),
          { provide: AuthService, useValue: mockAuthService },
        ],
      }).compileComponents();

      router = TestBed.inject(Router);
      vi.spyOn(router, 'navigate').mockResolvedValue(true);

      fixture = TestBed.createComponent(RegisterComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should create and validate register form', () => {
      expect(component).toBeTruthy();
      expect(component.registerForm.valid).toBe(false);

      component.registerForm.setValue({
        name: 'John Doe',
        email: 'john@example.com',
        username: 'johndoe',
        password: 'short',
      });
      // password minlength is 8
      expect(component.registerForm.valid).toBe(false);

      component.registerForm.patchValue({ password: 'password123' });
      expect(component.registerForm.valid).toBe(true);
    });

    it('should submit register and show success', () => {
      component.registerForm.setValue({
        name: 'John Doe',
        email: 'john@example.com',
        username: 'johndoe',
        password: 'password123',
      });

      component.onSubmit();

      expect(mockAuthService.register).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        username: 'johndoe',
        password: 'password123',
        role: 'USER',
      });
      expect(component.success()).toBe('User registered');
    });
  });

  describe('OAuthCallbackComponent', () => {
    let component: OAuthCallbackComponent;
    let fixture: ComponentFixture<OAuthCallbackComponent>;
    let router: Router;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [OAuthCallbackComponent],
        providers: [
          provideRouter([]),
          {
            provide: ActivatedRoute,
            useValue: {
              queryParams: of({ success: 'true', banks: 'POPULAR,BHD' }),
            },
          },
        ],
      }).compileComponents();

      router = TestBed.inject(Router);
      vi.spyOn(router, 'navigate').mockResolvedValue(true);

      fixture = TestBed.createComponent(OAuthCallbackComponent);
      component = fixture.componentInstance;
    });

    it('should create and format error messages', () => {
      expect(component).toBeTruthy();
      const errorMsg = component.getErrorMessage('invalid_bank_code', 'XYZ');
      expect(errorMsg).toContain('XYZ');
    });

    it('should navigate to dashboard', () => {
      component.goToDashboard();
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    });
  });
});
