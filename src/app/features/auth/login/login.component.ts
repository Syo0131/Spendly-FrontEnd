import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { TranslationService } from '../../../core/services/translation.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { UiButtonComponent } from '../../../shared/components/ui/ui-button.component';
import { UiInputDirective } from '../../../shared/components/ui/ui-input.directive';

@Component({
  selector: 'app-login',
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

      <!-- Brand -->
      <div class="relative text-center">
        <div class="mb-6 flex items-center justify-center gap-2.5">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-lg font-bold text-white shadow-lg shadow-primary/30"
          >
            S
          </div>
          <span class="font-display text-2xl font-semibold tracking-tight text-content">Spendly</span>
        </div>

        <h2 class="font-display text-3xl font-semibold tracking-tight text-content">
          {{ ts.t()('auth.welcome') }}
        </h2>
        <p class="mt-1.5 text-sm text-content-muted">
          {{ ts.t()('auth.subtitle') }}
        </p>
      </div>

      <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="relative mt-8 space-y-5">
        <!-- Username -->
        <div class="space-y-1.5">
          <label class="eyebrow ml-1">{{ ts.t()('auth.username') }}</label>
          <div class="group relative">
            <app-icon
              name="person"
              [size]="18"
              class="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-content-subtle transition-colors group-focus-within:text-primary"
            />
            <input
              uiInput
              type="text"
              formControlName="username"
              autocomplete="username"
              class="!pl-11"
              placeholder="johndoe"
            />
          </div>
        </div>

        <!-- Password -->
        <div class="space-y-1.5">
          <label class="eyebrow ml-1">{{ ts.t()('auth.password') }}</label>
          <div class="group relative">
            <app-icon
              name="lock"
              [size]="18"
              class="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-content-subtle transition-colors group-focus-within:text-primary"
            />
            <input
              uiInput
              [type]="showPassword() ? 'text' : 'password'"
              formControlName="password"
              autocomplete="current-password"
              class="!pl-11 !pr-11"
              placeholder="••••••••"
            />
            <button
              type="button"
              (click)="$event.preventDefault(); showPassword.set(!showPassword())"
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
          class="flex items-center gap-2 rounded-xl border border-expense/25 bg-expense/10 p-3 text-sm text-expense"
        >
          <app-icon name="error" [size]="18" class="shrink-0" />
          <span>{{ error() }}</span>
        </div>

        <!-- Submit -->
        <ui-button
          type="submit"
          [block]="true"
          [loading]="isLoading()"
          [disabled]="loginForm.invalid"
        >
          @if (isLoading()) {
          <span>{{ ts.t()('auth.login.loading') }}</span>
          } @else {
          <span>{{ ts.t()('auth.login') }}</span>
          <app-icon name="arrow_forward" [size]="18" />
          }
        </ui-button>

        <div class="text-center text-sm text-content-muted">
          {{ ts.t()('auth.no_account') }}
          <a
            routerLink="/auth/register"
            class="font-semibold text-primary-ink transition-colors hover:text-primary dark:text-primary-300"
            >{{ ts.t()('auth.signup') }}</a
          >
        </div>
      </form>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
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
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = signal(false);
  error = signal('');
  showPassword = signal(false);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    public ts: TranslationService
  ) {
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
