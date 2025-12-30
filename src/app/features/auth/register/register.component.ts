import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { TranslationService } from '../../../core/services/translation.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div
      class="glass-card p-8 w-full animate-fade-in shadow-2xl shadow-primary/10 border border-gray-200 dark:border-white/10"
    >
      <div class="text-center mb-8">
        <h2
          class="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-light to-secondary mb-2"
        >
          {{ ts.t()('auth.create_account') }}
        </h2>
        <p class="text-gray-500 dark:text-gray-400">{{ ts.t()('auth.join') }}</p>
      </div>

      <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="space-y-5">
        <!-- Name -->
        <div class="space-y-1">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">{{
            ts.t()('auth.name')
          }}</label>
          <input
            type="text"
            formControlName="name"
            class="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white text-sm rounded-xl focus:ring-primary focus:border-primary block p-3 transition-colors placeholder-gray-400 dark:placeholder-gray-600"
            placeholder="John Doe"
          />
        </div>

        <!-- Email -->
        <div class="space-y-1">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">{{
            ts.t()('auth.email')
          }}</label>
          <input
            type="email"
            formControlName="email"
            class="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white text-sm rounded-xl focus:ring-primary focus:border-primary block p-3 transition-colors placeholder-gray-400 dark:placeholder-gray-600"
            placeholder="john@example.com"
          />
        </div>

        <!-- Username -->
        <div class="space-y-1">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">{{
            ts.t()('auth.username')
          }}</label>
          <input
            type="text"
            formControlName="username"
            class="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white text-sm rounded-xl focus:ring-primary focus:border-primary block p-3 transition-colors placeholder-gray-400 dark:placeholder-gray-600"
            placeholder="johndoe"
          />
        </div>

        <!-- Password -->
        <div class="space-y-1">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">{{
            ts.t()('auth.password')
          }}</label>
          <div class="relative">
            <input
              [type]="showPassword() ? 'text' : 'password'"
              formControlName="password"
              class="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white text-sm rounded-xl focus:ring-primary focus:border-primary block p-3 pr-10 transition-colors placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="••••••••"
            />
            <button
              type="button"
              (click)="showPassword.set(!showPassword())"
              class="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none"
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
          class="p-3 text-sm text-red-600 dark:text-red-200 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg"
        >
          {{ error() }}
        </div>

        <!-- Success Message -->
        <div
          *ngIf="success()"
          class="p-3 text-sm text-green-600 dark:text-green-200 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg"
        >
          {{ success() }}
        </div>

        <button
          type="submit"
          [disabled]="registerForm.invalid || isLoading()"
          class="w-full mt-2 text-white bg-gradient-to-r from-primary to-primary-dark hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-primary/30 font-bold rounded-xl text-sm px-5 py-3.5 text-center transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] shadow-lg shadow-primary/25"
        >
          <span *ngIf="isLoading()" class="mr-2">...</span>
          {{ isLoading() ? ts.t()('auth.creating') : ts.t()('auth.signup') }}
        </button>

        <div class="text-center text-sm text-gray-500 dark:text-gray-400">
          {{ ts.t()('auth.have_account') }}
          <a
            routerLink="/auth/login"
            class="text-primary hover:text-primary-dark dark:text-primary-light dark:hover:text-white transition-colors font-semibold"
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
      console.log('Registering with payload:', payload);

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
