import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { TranslationService } from '../../../core/services/translation.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { UiButtonComponent } from '../../../shared/components/ui/ui-button.component';
import { UiInputDirective } from '../../../shared/components/ui/ui-input.directive';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    IconComponent,
    UiButtonComponent,
    UiInputDirective,
  ],
  template: `
    <div
      class="relative w-full overflow-hidden rounded-3xl border border-divider bg-surface-2 p-8 shadow-[0_20px_60px_-20px_rgba(43,38,32,0.25)] animate-fade-in sm:p-10"
    >
      <!-- Top accent glow -->
      <div
        class="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl"
      ></div>

      <div class="relative text-center mb-8">
        <div class="mb-6 flex items-center justify-center gap-2.5">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-lg font-bold text-primary-on shadow-lg shadow-primary/30"
          >
            S
          </div>
          <span class="font-display text-2xl font-semibold tracking-tight text-content">Spendly</span>
        </div>
        <h2 class="font-display text-3xl font-semibold tracking-tight text-content">
          {{ ts.t()('auth.create_account') }}
        </h2>
        <p class="mt-1.5 text-sm text-content-muted">{{ ts.t()('auth.join') }}</p>
      </div>

      <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="relative space-y-5">
        <!-- Name -->
        <div class="space-y-1.5">
          <label class="eyebrow ml-1">{{ ts.t()('auth.name') }}</label>
          <input uiInput type="text" formControlName="name" placeholder="John Doe" />
        </div>

        <!-- Email -->
        <div class="space-y-1.5">
          <label class="eyebrow ml-1">{{ ts.t()('auth.email') }}</label>
          <input uiInput type="email" formControlName="email" placeholder="john@example.com" />
        </div>

        <!-- Username -->
        <div class="space-y-1.5">
          <label class="eyebrow ml-1">{{ ts.t()('auth.username') }}</label>
          <input uiInput type="text" formControlName="username" placeholder="johndoe" />
        </div>

        <!-- Password -->
        <div class="space-y-1.5">
          <label class="eyebrow ml-1">{{ ts.t()('auth.password') }}</label>
          <div class="relative">
            <input
              uiInput
              [type]="showPassword() ? 'text' : 'password'"
              formControlName="password"
              class="!pr-11"
              placeholder="••••••••"
            />
            <button
              type="button"
              (click)="showPassword.set(!showPassword())"
              [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'"
              class="absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-content-subtle transition-colors hover:bg-surface-3 hover:text-content focus:outline-none"
            >
              <app-icon [name]="showPassword() ? 'visibility' : 'visibility_off'" [size]="18" />
            </button>
          </div>
        </div>

        <!-- Error Message -->
        <div
          *ngIf="error()"
          class="rounded-xl border border-expense/25 bg-expense/10 p-3 text-sm text-expense"
        >
          {{ error() }}
        </div>

        <!-- Success Message -->
        <div
          *ngIf="success()"
          class="rounded-xl border border-success/25 bg-success/10 p-3 text-sm text-success"
        >
          {{ success() }}
        </div>

        <ui-button
          type="submit"
          [block]="true"
          [loading]="isLoading()"
          [disabled]="registerForm.invalid"
        >
          {{ isLoading() ? ts.t()('auth.creating') : ts.t()('auth.signup') }}
        </ui-button>

        <div class="text-center text-sm text-content-muted">
          {{ ts.t()('auth.have_account') }}
          <a
            routerLink="/auth/login"
            class="font-semibold text-primary-ink transition-colors hover:text-primary dark:text-primary-300"
            >{{ ts.t()('auth.login') }}</a
          >
        </div>
      </form>
    </div>
  `,
  styles: [
    `
      .animate-fade-in {
        animation: fadeIn 0.5s ease-out;
      }
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
  ],
})
export class RegisterComponent {
  registerForm: FormGroup;
  isLoading = signal(false);
  error = signal('');
  success = signal('');
  showPassword = signal(false);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    public ts: TranslationService
  ) {
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
          this.isLoading.set(false);
          console.error('Registration error detail:', err);
          this.error.set(
            err.error?.mensaje ||
              err.error?.message ||
              `Registration failed: ${
                typeof err.error === 'string'
                  ? err.error
                  : JSON.stringify(err.error || err.statusText)
              }`
          );
        },
      });
    }
  }
}
