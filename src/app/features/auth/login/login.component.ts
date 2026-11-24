import { Component, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { TranslationService } from '../../../core/services/translation.service';
import { ButtonComponent, IconComponent, FormFieldComponent } from '../../../shared/ui';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    ButtonComponent,
    IconComponent,
    FormFieldComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="bg-surface-raised border border-border rounded-2xl p-6 sm:p-8 w-full max-w-md mx-auto shadow-xl space-y-6 animate-fade-in"
    >
      <div class="text-center space-y-2">
        <div
          class="w-14 h-14 rounded-2xl bg-accent/15 text-accent border border-accent/25 flex items-center justify-center mx-auto text-2xl font-bold shadow-sm"
        >
          <ui-icon name="lock" size="lg" />
        </div>
        <h2 class="text-2xl font-bold text-ink tracking-tight">
          {{ ts.t()('auth.welcome') }}
        </h2>
        <p class="text-xs text-ink-muted">{{ ts.t()('auth.subtitle') }}</p>
      </div>

      <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-4">
        <!-- Username -->
        <ui-form-field fieldId="login-username" [label]="ts.t()('auth.username')">
          <div class="relative">
            <span class="absolute left-3 top-3 text-ink-muted pointer-events-none select-none">
              <ui-icon name="person" size="sm" />
            </span>
            <input
              id="login-username"
              type="text"
              formControlName="username"
              class="w-full bg-surface-sunken border border-border text-ink text-sm rounded-lg p-2.5 pl-9 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent placeholder-ink-muted/50 transition-colors"
              placeholder="johndoe"
            />
          </div>
        </ui-form-field>

        <!-- Password -->
        <ui-form-field fieldId="login-password" [label]="ts.t()('auth.password')">
          <div class="relative">
            <span class="absolute left-3 top-3 text-ink-muted pointer-events-none select-none">
              <ui-icon name="lock" size="sm" />
            </span>
            <input
              id="login-password"
              [type]="showPassword() ? 'text' : 'password'"
              formControlName="password"
              class="w-full bg-surface-sunken border border-border text-ink text-sm rounded-lg p-2.5 pl-9 pr-10 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent placeholder-ink-muted/50 transition-colors"
              placeholder="••••••••"
            />
            <button
              type="button"
              (click)="showPassword.set(!showPassword())"
              [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'"
              class="absolute right-2.5 top-2.5 text-ink-muted hover:text-ink focus:outline-none"
            >
              <ui-icon [name]="showPassword() ? 'visibility' : 'visibility_off'" size="sm" />
            </button>
          </div>
        </ui-form-field>

        <!-- Error Message -->
        @if (error()) {
          <div
            class="p-3 text-xs text-expense bg-expense/10 border border-expense/25 rounded-lg flex items-center gap-2 animate-fade-in"
            role="alert"
          >
            <ui-icon name="error" size="sm" />
            <span>{{ error() }}</span>
          </div>
        }

        <div class="pt-2">
          <button
            uiButton
            variant="primary"
            size="lg"
            type="submit"
            [disabled]="loginForm.invalid || isLoading()"
            class="w-full justify-center"
          >
            @if (isLoading()) {
              <ui-icon name="sync" size="sm" class="mr-2 animate-spin" />
            }
            {{ isLoading() ? ts.t()('auth.login.loading') : ts.t()('auth.login') }}
          </button>
        </div>

        <div class="text-center text-xs text-ink-muted pt-2">
          {{ ts.t()('auth.no_account') }}
          <a
            routerLink="/auth/register"
            class="text-accent hover:underline font-semibold ml-1"
          >
            {{ ts.t()('auth.signup') }}
          </a>
        </div>
      </form>
    </div>
  `,
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  public ts = inject(TranslationService);

  loginForm: FormGroup;
  isLoading = signal(false);
  error = signal('');
  showPassword = signal(false);

  constructor() {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading.set(true);
      this.error.set('');

      this.authService.login(this.loginForm.value).subscribe({
        next: () => {
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          console.error('Login error:', err);
          this.isLoading.set(false);
          this.error.set(err.error?.mensaje || 'Invalid credentials');
        },
      });
    }
  }
}
