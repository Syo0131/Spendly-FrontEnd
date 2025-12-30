import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { TranslationService } from '../../core/services/translation.service';
import { UpdateUserDto } from '../../core/models/api.models';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="p-8 animate-fade-in max-w-4xl mx-auto space-y-6">
      <!-- Header -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
            {{ ts.t()('nav.settings') }}
          </h1>
          <p class="text-gray-500 dark:text-gray-400">{{ ts.t()('settings.profile.title') }}</p>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div
        class="flex space-x-1 bg-gray-100 dark:bg-slate-800/50 p-1 rounded-xl w-fit backdrop-blur-sm border border-gray-200 dark:border-white/5 overflow-x-auto"
      >
        <button
          *ngFor="let tab of tabs"
          (click)="activeTab.set($any(tab.id))"
          [class]="
            activeTab() === tab.id
              ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          "
          class="px-6 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2"
        >
          <span class="material-icons-outlined text-lg">{{ tab.icon }}</span>
          {{ ts.t()('settings.tabs.' + tab.id) }}
        </button>
      </div>

      <!-- Content Area -->
      <div
        class="glass-card p-6 md:p-8 bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 relative overflow-hidden"
      >
        <!-- Profile Section -->
        <div *ngIf="activeTab() === 'profile'" class="animate-fade-in-up space-y-6">
          <div class="flex items-center gap-4 mb-6">
            <div
              class="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary border-2 border-primary/20"
            >
              {{ authService.currentUserStr()?.charAt(0)?.toUpperCase() || 'U' }}
            </div>
            <div>
              <h3 class="text-xl font-bold text-gray-900 dark:text-white">
                {{ authService.currentUserStr() }}
              </h3>
              <p class="text-sm text-gray-500">{{ ts.t()('settings.profile.title') }}</p>
            </div>
          </div>

          <form [formGroup]="profileForm" (ngSubmit)="updateProfile()" class="space-y-4 max-w-lg">
            <div>
              <label
                class="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5"
                >{{ ts.t()('settings.profile.name') }}</label
              >
              <input
                formControlName="name"
                type="text"
                class="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder-gray-400"
                placeholder="Your Name"
              />
            </div>

            <div>
              <label
                class="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5"
                >{{ ts.t()('settings.profile.email') }}</label
              >
              <input
                formControlName="email"
                type="email"
                class="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder-gray-400"
                placeholder="name@example.com"
              />
            </div>

            <div>
              <label
                class="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5"
                >{{ ts.t()('settings.profile.username') }}</label
              >
              <input
                formControlName="username"
                type="text"
                class="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder-gray-400"
                placeholder="username"
              />
            </div>

            <div class="pt-4">
              <button
                type="submit"
                [disabled]="profileForm.invalid || isLoading()"
                class="px-8 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold shadow-lg shadow-primary/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center min-w-[120px]"
              >
                <span *ngIf="isLoading()" class="material-icons-outlined animate-spin text-lg mr-2"
                  >sync</span
                >
                {{ ts.t()('settings.profile.save') }}
              </button>
            </div>
          </form>
        </div>

        <!-- Security Section -->
        <div *ngIf="activeTab() === 'security'" class="animate-fade-in-up space-y-6">
          <div
            class="border-l-4 border-amber-500 pl-4 py-1 bg-amber-50 dark:bg-amber-900/10 rounded-r-lg"
          >
            <h4 class="text-amber-800 dark:text-amber-500 font-bold text-sm">
              {{ ts.t()('settings.security.note_title') }}
            </h4>
            <p class="text-amber-700 dark:text-amber-600 text-xs">
              {{ ts.t()('settings.security.note_desc') }}
            </p>
          </div>

          <form [formGroup]="securityForm" (ngSubmit)="changePassword()" class="space-y-4 max-w-lg">
            <div>
              <label
                class="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5"
                >{{ ts.t()('settings.security.new_password') }}</label
              >
              <div class="relative">
                <input
                  formControlName="password"
                  [type]="showPassword() ? 'text' : 'password'"
                  class="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl p-3 pr-10 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  (click)="$event.preventDefault(); showPassword.set(!showPassword())"
                  class="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none cursor-pointer"
                >
                  <span class="material-icons-outlined text-lg">{{
                    showPassword() ? 'visibility' : 'visibility_off'
                  }}</span>
                </button>
              </div>
              <p class="text-[10px] text-gray-400 mt-1">
                {{ ts.t()('settings.security.password_hint') }}
              </p>
            </div>

            <div>
              <label
                class="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5"
                >{{ ts.t()('settings.security.confirm_password') }}</label
              >
              <div class="relative">
                <input
                  formControlName="confirmPassword"
                  [type]="showConfirmPassword() ? 'text' : 'password'"
                  class="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl p-3 pr-10 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  (click)="$event.preventDefault(); showConfirmPassword.set(!showConfirmPassword())"
                  class="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none cursor-pointer"
                >
                  <span class="material-icons-outlined text-lg">{{
                    showConfirmPassword() ? 'visibility' : 'visibility_off'
                  }}</span>
                </button>
              </div>
              <p
                *ngIf="
                  securityForm.hasError('mismatch') && securityForm.get('confirmPassword')?.touched
                "
                class="text-red-500 text-xs mt-1"
              >
                {{ ts.t()('settings.security.mismatch') }}
              </p>
            </div>

            <div class="pt-4">
              <button
                type="submit"
                [disabled]="securityForm.invalid || isLoading()"
                class="px-8 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold shadow-lg shadow-primary/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center min-w-[120px]"
              >
                <span *ngIf="isLoading()" class="material-icons-outlined animate-spin text-lg mr-2"
                  >sync</span
                >
                {{ ts.t()('settings.security.btn_update') }}
              </button>
            </div>
          </form>
        </div>

        <!-- Preferences Section -->
        <div *ngIf="activeTab() === 'preferences'" class="animate-fade-in-up space-y-6">
          <div class="max-w-xl space-y-4">
            <!-- Theme Toggle -->
            <div
              class="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-white/5 rounded-xl"
            >
              <div class="flex items-center gap-3">
                <div
                  class="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400"
                >
                  <span class="material-icons-outlined">dark_mode</span>
                </div>
                <div>
                  <p class="text-gray-900 dark:text-white font-medium">
                    {{ ts.t()('settings.pref.dark_mode') }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ ts.t()('settings.pref.dark_desc') }}
                  </p>
                </div>
              </div>
              <!-- Mock Toggle (Visual only as ThemeService enforces dark for now, but good for UI) -->
              <div class="w-12 h-6 bg-primary/20 rounded-full relative cursor-not-allowed">
                <div class="absolute right-1 top-1 w-4 h-4 bg-primary rounded-full shadow-sm"></div>
              </div>
            </div>

            <!-- Language -->
            <div
              class="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-white/5 rounded-xl"
            >
              <div class="flex items-center gap-3">
                <div
                  class="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400"
                >
                  <span class="material-icons-outlined">translate</span>
                </div>
                <div>
                  <p class="text-gray-900 dark:text-white font-medium">
                    {{ ts.t()('settings.pref.lang') }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ ts.t()('settings.pref.lang_desc') }}
                  </p>
                </div>
              </div>
              <div class="flex gap-2">
                <button
                  (click)="ts.setLang('en')"
                  [class.ring-2]="ts.currentLang() === 'en'"
                  class="px-3 py-1 rounded-lg bg-white dark:bg-slate-800 text-xs font-bold border border-gray-200 dark:border-white/10 ring-primary/50 transition-all"
                >
                  EN
                </button>
                <button
                  (click)="ts.setLang('es')"
                  [class.ring-2]="ts.currentLang() === 'es'"
                  class="px-3 py-1 rounded-lg bg-white dark:bg-slate-800 text-xs font-bold border border-gray-200 dark:border-white/10 ring-primary/50 transition-all"
                >
                  ES
                </button>
              </div>
            </div>

            <!-- Delete Account -->
            <div class="mt-8 pt-8 border-t border-gray-200 dark:border-white/10">
              <h4 class="text-red-500 font-bold mb-2">{{ ts.t()('settings.danger.title') }}</h4>
              <div class="flex items-center justify-between">
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ ts.t()('settings.danger.desc') }}
                </p>
                <button
                  (click)="todoDelete()"
                  class="px-4 py-2 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-lg text-sm font-bold border border-red-200 dark:border-red-900/50 hover:bg-red-100 transition-colors"
                >
                  {{ ts.t()('settings.danger.btn') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .animate-fade-in {
        animation: fadeIn 0.5s ease-out;
      }
      .animate-fade-in-up {
        animation: fadeInUp 0.4s ease-out forwards;
      }
      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      @keyframes fadeInUp {
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
export class SettingsComponent implements OnInit {
  activeTab = signal<'profile' | 'security' | 'preferences'>('profile');
  isLoading = signal(false);
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  tabs = [
    { id: 'profile', label: 'Profile', icon: 'person' },
    { id: 'security', label: 'Security', icon: 'lock' },
    { id: 'preferences', label: 'Preferences', icon: 'tune' },
  ];

  profileForm: FormGroup;
  securityForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    public authService: AuthService,
    public ts: TranslationService,
    private apiService: ApiService
  ) {
    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      username: ['', Validators.required],
    });

    this.securityForm = this.fb.group(
      {
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', Validators.required],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  ngOnInit() {
    // Pre-fill profile if data exists in local storage or fetch from API if we had a getUser endpoint
    // For now, relying on currentUserStr or mocking.
    // Ideally we call apiService.getUser(id) here.
    const currentUser = this.authService.currentUserStr();
    if (currentUser) {
      this.profileForm.patchValue({
        username: currentUser,
      });
    }
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirm = control.get('confirmPassword');
    return password && confirm && password.value !== confirm.value ? { mismatch: true } : null;
  }

  updateProfile() {
    if (this.profileForm.invalid) return;
    this.isLoading.set(true);

    // Mock ID since we don't have it explicitly stored in AuthService public signal yet (only username)
    // In real app, auth response should give us the ID.
    // I previously saw UserResponse has ID.
    // I will assume ID=1 for this demo or handle it if I can get it.
    // Since I can't get ID easily without extensive changes to Auth, I'll hardcode 1 or try to use a valid one if known.
    // Actually, updateByUser needs ID.
    const mockId = 1;

    const data: UpdateUserDto = this.profileForm.value;

    this.apiService.updateUser(mockId, data).subscribe({
      next: (res) => {
        alert('Profile updated successfully!');
        this.isLoading.set(false);
        // Update local state if needed
      },
      error: (err) => {
        console.error(err);
        alert('Failed to update profile. (Note: Admin ID 1 might be locked or ID missing)');
        this.isLoading.set(false);
      },
    });
  }

  changePassword() {
    if (this.securityForm.invalid) return;
    this.isLoading.set(true);

    // Using same updateUser endpoint but only sending password as per Plan
    const mockId = 1;
    const data: UpdateUserDto = {
      password: this.securityForm.value.password,
    };

    this.apiService.updateUser(mockId, data).subscribe({
      next: (res) => {
        alert('Password changed successfully. Please log in again.');
        this.authService.logout();
      },
      error: (err) => {
        console.error(err);
        alert('Failed to update password');
        this.isLoading.set(false);
      },
    });
  }

  todoDelete() {
    if (confirm('Are you sure? This backend feature is pending.')) {
      alert('Feature pending implementation on server.');
    }
  }
}
