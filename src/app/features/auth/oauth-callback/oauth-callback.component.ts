import { Component, OnInit, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslationService } from '../../../core/services/translation.service';
import { ButtonComponent, IconComponent } from '../../../shared/ui';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  imports: [CommonModule, ButtonComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen flex items-center justify-center p-4">
      <div
        class="bg-surface-raised border border-border rounded-2xl p-6 sm:p-8 max-w-md w-full text-center shadow-xl space-y-6 animate-fade-in"
      >
        <!-- Loading State -->
        @if (loading()) {
          <div class="space-y-4 py-6">
            <ui-icon name="sync" size="lg" class="animate-spin text-accent mx-auto" />
            <p class="text-ink-muted text-sm">{{ ts.t()('oauth.processing') }}</p>
          </div>
        }

        <!-- Success State -->
        @if (!loading() && success()) {
          <div class="space-y-6 animate-fade-in">
            <div
              class="w-16 h-16 bg-income/15 text-income border border-income/25 rounded-2xl flex items-center justify-center mx-auto shadow-sm"
            >
              <ui-icon name="check_circle" size="lg" />
            </div>

            <div>
              <h2 class="text-2xl font-bold text-ink">
                {{ ts.t()('oauth.success_title') }}
              </h2>
              <p class="text-ink-muted text-sm mt-2">
                {{ ts.t()('oauth.success_desc') }}
                <span class="font-semibold text-accent block mt-1.5">{{ connectedBanks() }}</span>
              </p>
            </div>

            <button
              uiButton
              variant="primary"
              size="lg"
              class="w-full justify-center"
              (click)="goToDashboard()"
            >
              {{ ts.t()('oauth.go_dashboard') }}
            </button>
          </div>
        }

        <!-- Error State -->
        @if (!loading() && !success()) {
          <div class="space-y-6 animate-fade-in">
            <div
              class="w-16 h-16 bg-expense/15 text-expense border border-expense/25 rounded-2xl flex items-center justify-center mx-auto shadow-sm"
            >
              <ui-icon name="error_outline" size="lg" />
            </div>

            <div>
              <h2 class="text-2xl font-bold text-ink">
                {{ ts.t()('oauth.error_title') }}
              </h2>
              <p
                class="text-expense text-xs bg-expense/10 border border-expense/25 p-3 rounded-lg mt-3"
              >
                {{ errorMessage() }}
              </p>
            </div>

            <button
              uiButton
              variant="secondary"
              size="lg"
              class="w-full justify-center"
              (click)="retry()"
            >
              {{ ts.t()('oauth.retry') }}
            </button>
          </div>
        }
      </div>
    </div>
  `,
})
export class OAuthCallbackComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public ts = inject(TranslationService);

  loading = signal<boolean>(true);
  success = signal<boolean>(false);
  connectedBanks = signal<string>('');
  errorMessage = signal<string>('');

  ngOnInit() {
    this.route.queryParams.subscribe({
      next: (params) => {
        setTimeout(() => {
          this.loading.set(false);
          const isSuccess = params['success'] === 'true';
          this.success.set(isSuccess);

          if (isSuccess) {
            const banksParam = params['banks'] || '';
            this.connectedBanks.set(banksParam.split(',').join(', '));
          } else {
            this.errorMessage.set(
              this.getErrorMessage(params['error'], params['bank'], params['message']),
            );
          }
        }, 1000);
      },
    });
  }

  getErrorMessage(error: string, bank?: string, message?: string): string {
    const errorMap: { [key: string]: string } = {
      invalid_state: this.ts.t()('oauth.error_invalid_state'),
      invalid_bank_code: `${this.ts.t()('oauth.error_invalid_bank')}${bank ? ' (' + bank + ')' : ''}`,
      no_banks: this.ts.t()('oauth.error_no_banks'),
      unsupported_bank: `${this.ts.t()('oauth.error_unsupported_bank')}${bank ? ' (' + bank + ')' : ''}`,
      invalid_user_id: this.ts.t()('oauth.error_invalid_user'),
    };

    return errorMap[error] || message || this.ts.t()('oauth.error_unknown');
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  retry() {
    this.router.navigate(['/banks']);
  }
}
