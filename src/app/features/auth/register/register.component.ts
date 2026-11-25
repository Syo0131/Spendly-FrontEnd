import { Component, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { TranslationService } from '../../../core/services/translation.service';
import { ButtonComponent, IconComponent, FormFieldComponent } from '../../../shared/ui';

@Component({
  selector: 'app-register',
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
        <h2 class="text-2xl font-bold text-ink tracking-tight">
          {{ ts.t()('auth.create_account') }}
        </h2>
        <p class="text-xs text-ink-muted">{{ ts.t()('auth.join') }}</p>
      </div>

      <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="space-y-4">
        <!-- Name -->
        <ui-form-field fieldId="reg-name" [label]="ts.t()('auth.name')">
          <input
            id="reg-name"
            type="text"
            formControlName="name"
            class="w-full bg-surface-sunken border border-border text-ink text-sm rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent placeholder-ink-muted/50 transition-colors"
            placeholder="John Doe"
          />
        </ui-form-field>

        <!-- Email -->
        <ui-form-field fieldId="reg-email" [label]="ts.t()('auth.email')">
          <input
            id="reg-email"
            type="email"
            formControlName="email"
            class="w-full bg-surface-sunken border border-border text-ink text-sm rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent placeholder-ink-muted/50 transition-colors"
            placeholder="john@example.com"
          />
        </ui-form-field>

        <!-- Username -->
        <ui-form-field fieldId="reg-username" [label]="ts.t()('auth.username')">
          <input
            id="reg-username"
            type="text"
            formControlName="username"
            class="w-full bg-surface-sunken border border-border text-ink text-sm rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent placeholder-ink-muted/50 transition-colors"
            placeholder="johndoe"
          />
        </ui-form-field>

        <!-- Password -->
        <ui-form-field fieldId="reg-password" [label]="ts.t()('auth.password')">
          <div class="relative">
            <input
              id="reg-password"
              [type]="showPassword() ? 'text' : 'password'"
              formControlName="password"
              class="w-full bg-surface-sunken border border-border text-ink text-sm rounded-lg p-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent placeholder-ink-muted/50 transition-colors"
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

        <!-- Success Message -->
        @if (success()) {
          <div
            class="p-3 text-xs text-income bg-income/10 border border-income/25 rounded-lg flex items-center gap-2 animate-fade-in"
          >
            <ui-icon name="check_circle" size="sm" />
            <span>{{ success() }}</span>
          </div>
        }

        <div class="pt-2">
          <button
            uiButton
            variant="primary"
            size="lg"
            type="submit"
            [disabled]="registerForm.invalid || isLoading()"
            class="w-full justify-center"
          >
            @if (isLoading()) {
              <ui-icon name="sync" size="sm" class="animate-spin" />
            }
            {{ isLoading() ? ts.t()('auth.creating') : ts.t()('auth.signup') }}
          </button>
        </div>

        <div class="text-center text-xs text-ink-muted pt-2">
          {{ ts.t()('auth.have_account') }}
          <a
            routerLink="/auth/login"
            class="text-accent hover:underline font-semibold ml-1"
          >
            {{ ts.t()('auth.login') }}
          </a>
        </div>
      </form>
    </div>
  `,
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  public ts = inject(TranslationService);

  registerForm: FormGroup;
  isLoading = signal(false);
  error = signal('');
  success = signal('');
  showPassword = signal(false);

  constructor() {
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      username: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  onSubmit() {
    if (this.registerForm.valid) {
      this.isLoading.set(true);
      this.error.set('');
      this.success.set('');

      const payload = { ...this.registerForm.value, role: 'USER' };

      this.authService.register(payload).subscribe({
        next: (res) => {
          this.isLoading.set(false);
          this.success.set(res.mensaje || 'Registration successful! Redirecting...');
          setTimeout(() => this.router.navigate(['/auth/login']), 2000);
        },
        error: (err) => {
          console.error('Registration error:', err);
          this.isLoading.set(false);
          this.error.set(err.error?.mensaje || 'Error registering user. Try a different username.');
        },
      });
    }
  }
}
