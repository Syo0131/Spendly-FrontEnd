import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
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
import { ThemeService } from '../../core/services/theme.service';
import { NotificationService } from '../../core/services/notification.service';
import { UpdateUserDto } from '../../core/models/api.models';
import {
  ButtonComponent,
  IconComponent,
  PageHeaderComponent,
  FormFieldComponent,
  SegmentedControlComponent,
  SegmentedControlOption,
  ToggleComponent,
} from '../../shared/ui';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonComponent,
    IconComponent,
    PageHeaderComponent,
    FormFieldComponent,
    SegmentedControlComponent,
    ToggleComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 max-w-4xl">
      <!-- Header -->
      <ui-page-header
        [title]="ts.t()('nav.settings')"
        [subtitle]="ts.t()('settings.profile.title')"
      />

      <!-- Navigation Tabs -->
      <div class="w-full sm:w-auto">
        <ui-segmented-control
          [options]="tabOptions()"
          [value]="activeTab()"
          (valueChange)="setTab($any($event))"
        />
      </div>

      <!-- Content Area -->
      <div
        class="bg-surface-raised border border-border rounded-xl p-6 sm:p-8 space-y-6 shadow-sm"
      >
        <!-- Profile Section -->
        @if (activeTab() === 'profile') {
        <div class="space-y-6 animate-fade-in">
          <div class="flex items-center gap-4">
            <div
              class="w-16 h-16 rounded-full bg-accent/15 text-accent border border-accent/25 flex items-center justify-center text-2xl font-bold select-none"
            >
              {{ authService.currentUserStr()?.charAt(0)?.toUpperCase() || 'U' }}
            </div>
            <div>
              <h3 class="text-lg font-semibold text-ink">
                {{ authService.currentUserStr() }}
              </h3>
              <p class="text-xs text-ink-muted">{{ ts.t()('settings.profile.title') }}</p>
            </div>
          </div>

          <form [formGroup]="profileForm" (ngSubmit)="updateProfile()" class="space-y-4 max-w-lg">
            <ui-form-field fieldId="settings-name" [label]="ts.t()('settings.profile.name')">
              <input
                id="settings-name"
                formControlName="name"
                type="text"
                class="w-full bg-surface-sunken border border-border text-ink text-sm rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent placeholder-ink-muted/50"
                placeholder="Your Name"
              />
            </ui-form-field>

            <ui-form-field fieldId="settings-email" [label]="ts.t()('settings.profile.email')">
              <input
                id="settings-email"
                formControlName="email"
                type="email"
                class="w-full bg-surface-sunken border border-border text-ink text-sm rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent placeholder-ink-muted/50"
                placeholder="name@example.com"
              />
            </ui-form-field>

            <ui-form-field fieldId="settings-username" [label]="ts.t()('settings.profile.username')">
              <input
                id="settings-username"
                formControlName="username"
                type="text"
                class="w-full bg-surface-sunken border border-border text-ink text-sm rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent placeholder-ink-muted/50"
                placeholder="username"
              />
            </ui-form-field>

            <div class="pt-2">
              <button
                uiButton
                variant="primary"
                type="submit"
                [disabled]="profileForm.invalid || isLoading()"
              >
                @if (isLoading()) {
                  <ui-icon name="sync" size="sm" class="mr-1.5 animate-spin" />
                }
                {{ ts.t()('settings.profile.save') }}
              </button>
            </div>
          </form>
        </div>
        }

        <!-- Security Section -->
        @if (activeTab() === 'security') {
        <div class="space-y-6 animate-fade-in">
          <div
            class="border-l-4 border-amber-500 pl-4 py-2 bg-amber-500/10 rounded-r-lg"
          >
            <h4 class="text-amber-500 font-semibold text-sm">
              {{ ts.t()('settings.security.note_title') }}
            </h4>
            <p class="text-ink-muted text-xs mt-0.5">
              {{ ts.t()('settings.security.note_desc') }}
            </p>
          </div>

          <form [formGroup]="securityForm" (ngSubmit)="changePassword()" class="space-y-4 max-w-lg">
            <ui-form-field
              fieldId="settings-pwd"
              [label]="ts.t()('settings.security.new_password')"
              [hint]="ts.t()('settings.security.password_hint')"
            >
              <div class="relative">
                <input
                  id="settings-pwd"
                  formControlName="password"
                  [type]="showPassword() ? 'text' : 'password'"
                  class="w-full bg-surface-sunken border border-border text-ink text-sm rounded-lg p-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
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

            <ui-form-field
              fieldId="settings-cpwd"
              [label]="ts.t()('settings.security.confirm_password')"
              [error]="securityForm.hasError('mismatch') && securityForm.get('confirmPassword')?.touched ? ts.t()('settings.security.mismatch') : null"
            >
              <div class="relative">
                <input
                  id="settings-cpwd"
                  formControlName="confirmPassword"
                  [type]="showConfirmPassword() ? 'text' : 'password'"
                  class="w-full bg-surface-sunken border border-border text-ink text-sm rounded-lg p-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  (click)="showConfirmPassword.set(!showConfirmPassword())"
                  [attr.aria-label]="showConfirmPassword() ? 'Hide password' : 'Show password'"
                  class="absolute right-2.5 top-2.5 text-ink-muted hover:text-ink focus:outline-none"
                >
                  <ui-icon [name]="showConfirmPassword() ? 'visibility' : 'visibility_off'" size="sm" />
                </button>
              </div>
            </ui-form-field>

            <div class="pt-2">
              <button
                uiButton
                variant="primary"
                type="submit"
                [disabled]="securityForm.invalid || isLoading()"
              >
                @if (isLoading()) {
                  <ui-icon name="sync" size="sm" class="mr-1.5 animate-spin" />
                }
                {{ ts.t()('settings.security.btn_update') }}
              </button>
            </div>
          </form>
        </div>
        }

        <!-- Preferences Section -->
        @if (activeTab() === 'preferences') {
        <div class="space-y-6 animate-fade-in max-w-xl">
          <!-- Theme Toggle -->
          <div
            class="flex items-center justify-between p-4 bg-surface-sunken border border-border rounded-xl"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-lg bg-surface flex items-center justify-center border border-border text-ink"
              >
                <ui-icon name="dark_mode" size="md" />
              </div>
              <div>
                <p class="text-ink font-medium text-sm">
                  {{ ts.t()('settings.pref.dark_mode') }}
                </p>
                <p class="text-xs text-ink-muted">
                  {{ ts.t()('settings.pref.dark_desc') }}
                </p>
              </div>
            </div>
            <ui-toggle
              [checked]="themeService.darkMode()"
              (change)="themeService.toggleTheme()"
              [label]="''"
            />
          </div>

          <!-- Language -->
          <div
            class="flex items-center justify-between p-4 bg-surface-sunken border border-border rounded-xl"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-lg bg-surface flex items-center justify-center border border-border text-ink"
              >
                <ui-icon name="translate" size="md" />
              </div>
              <div>
                <p class="text-ink font-medium text-sm">
                  {{ ts.t()('settings.pref.lang') }}
                </p>
                <p class="text-xs text-ink-muted">
                  {{ ts.t()('settings.pref.lang_desc') }}
                </p>
              </div>
            </div>
            <ui-segmented-control
              [options]="langOptions"
              [value]="ts.currentLang()"
              (valueChange)="ts.setLang($any($event))"
            />
          </div>

          <!-- Delete Account -->
          <div class="mt-8 pt-6 border-t border-border">
            <h4 class="text-danger font-semibold text-sm mb-1">
              {{ ts.t()('settings.danger.title') }}
            </h4>
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <p class="text-xs text-ink-muted">
                {{ ts.t()('settings.danger.desc') }}
              </p>
              <button
                uiButton
                variant="danger"
                size="sm"
                (click)="todoDelete()"
              >
                {{ ts.t()('settings.danger.btn') }}
              </button>
            </div>
          </div>
        </div>
        }
      </div>
    </div>
  `,
})
export class SettingsComponent implements OnInit {
  fb = inject(FormBuilder);
  authService = inject(AuthService);
  ts = inject(TranslationService);
  themeService = inject(ThemeService);
  apiService = inject(ApiService);
  ns = inject(NotificationService);

  activeTab = signal<'profile' | 'security' | 'preferences'>('profile');
  isLoading = signal(false);
  showPassword = signal(false);
  showConfirmPassword = signal(false);

  tabOptions = computed<SegmentedControlOption<string>[]>(() => [
    { value: 'profile', label: this.ts.t()('settings.tabs.profile') },
    { value: 'security', label: this.ts.t()('settings.tabs.security') },
    { value: 'preferences', label: this.ts.t()('settings.tabs.preferences') },
  ]);

  langOptions: SegmentedControlOption<string>[] = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español' },
  ];

  profileForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    username: ['', Validators.required],
  });

  securityForm: FormGroup = this.fb.group(
    {
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: this.passwordMatchValidator }
  );

  ngOnInit() {
    const currentUser = this.authService.currentUserStr();
    if (currentUser) {
      this.profileForm.patchValue({
        username: currentUser,
      });
    }
  }

  setTab(tab: 'profile' | 'security' | 'preferences') {
    this.activeTab.set(tab);
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirm = control.get('confirmPassword');
    return password && confirm && password.value !== confirm.value ? { mismatch: true } : null;
  }

  updateProfile() {
    if (this.profileForm.invalid) return;

    const userId = this.authService.getUserId();
    if (userId === null) {
      this.ns.show('settings.session_invalid', 'error');
      return;
    }

    this.isLoading.set(true);
    const data: UpdateUserDto = this.profileForm.value;

    this.apiService.updateUser(userId, data).subscribe({
      next: () => {
        this.ns.show('notif.profile_updated', 'success', 3000);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.ns.show('notif.profile_fail', 'error');
        this.isLoading.set(false);
      },
    });
  }

  changePassword() {
    if (this.securityForm.invalid) return;

    const userId = this.authService.getUserId();
    if (userId === null) {
      this.ns.show('settings.session_invalid', 'error');
      return;
    }

    this.isLoading.set(true);
    const data: UpdateUserDto = {
      password: this.securityForm.value.password,
    };

    this.apiService.updateUser(userId, data).subscribe({
      next: () => {
        this.ns.show('notif.account_disabled', 'success', 2000);
        setTimeout(() => this.authService.logout(), 2000);
      },
      error: (err) => {
        console.error(err);
        this.ns.show('notif.account_fail', 'error');
        this.isLoading.set(false);
      },
    });
  }

  todoDelete() {
    this.ns.show('notif.pending', 'info');
  }
}
