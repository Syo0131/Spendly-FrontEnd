import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { TranslationService } from '../../../core/services/translation.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div
      class="glass-card p-8 w-full animate-fade-in shadow-2xl shadow-primary/10 border border-white/10 dark:border-white/5"
    >
      <div class="text-center mb-8">
        <div
          class="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mx-auto mb-4 border border-white/5"
        >
          <span class="text-2xl">🔐</span>
        </div>
        <h2
          class="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-light to-secondary mb-2"
        >
          {{ ts.t()('auth.welcome') }}
        </h2>
        <p class="text-gray-500 dark:text-gray-400">{{ ts.t()('auth.subtitle') }}</p>
      </div>

      <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-6">
        <!-- Username -->
        <div class="space-y-2">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">{{
            ts.t()('auth.username')
          }}</label>
          <div class="relative">
            <span class="absolute left-3 top-3.5 text-gray-500 material-icons-outlined text-sm"
              >person</span
            >
            <input
              type="text"
              formControlName="username"
              class="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white text-sm rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary block p-3.5 pl-9 transition-all placeholder-gray-400 dark:placeholder-gray-600"
              placeholder="johndoe"
            />
          </div>
        </div>

        <!-- Password -->
        <div class="space-y-2">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">{{
            ts.t()('auth.password')
          }}</label>
          <div class="relative">
            <span class="absolute left-3 top-3.5 text-gray-500 material-icons-outlined text-sm"
              >lock</span
            >
            <input
              [type]="showPassword() ? 'text' : 'password'"
              formControlName="password"
              class="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white text-sm rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary block p-3.5 pl-9 pr-10 transition-all placeholder-gray-400 dark:placeholder-gray-600"
              placeholder="••••••••"
            />
            <button
              type="button"
              (click)="$event.preventDefault(); showPassword.set(!showPassword())"
              class="absolute right-3 top-3.5 z-10 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none cursor-pointer"
            >
              <span class="material-icons-outlined text-lg">{{
                showPassword() ? 'visibility' : 'visibility_off'
              }}</span>
            </button>
          </div>
        </div>

        <!-- Error Message -->
        <div
          *ngIf="error()"
          class="p-3 text-sm text-red-600 dark:text-red-200 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-center"
        >
          <span class="material-icons-outlined mr-2 text-sm">error</span>
          {{ error() }}
        </div>

        <button
          type="submit"
          [disabled]="loginForm.invalid || isLoading()"
          class="w-full text-white bg-gradient-to-r from-primary to-secondary hover:from-primary-dark hover:to-secondary-dark font-bold rounded-xl text-sm px-5 py-3.5 text-center transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/25"
        >
          <span *ngIf="isLoading()" class="mr-2">...</span>
          {{ isLoading() ? ts.t()('auth.login.loading') : ts.t()('auth.login') }}
        </button>

        <div class="text-center text-sm text-gray-500 dark:text-gray-400">
          {{ ts.t()('auth.no_account') }}
          <a
            routerLink="/auth/register"
            class="text-primary dark:hover:text-white transition-colors font-semibold"
            >{{ ts.t()('auth.signup') }}</a
          >
        </div>
      </form>
    </div>
  `,
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
