import {
  Component,
  OnInit,
  signal,
  inject,
  effect,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { BankOption } from '../../core/models/api.models';
import { TranslationService } from '../../core/services/translation.service';
import { NotificationService } from '../../core/services/notification.service';
import {
  ButtonComponent,
  IconComponent,
  PageHeaderComponent,
  UiDialogService,
} from '../../shared/ui';

@Component({
  selector: 'app-banks',
  standalone: true,
  imports: [
    CommonModule,
    ButtonComponent,
    IconComponent,
    PageHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 relative min-h-[60vh]">
      <!-- Header -->
      <ui-page-header
        [title]="ts.t()('banks.title')"
        [subtitle]="ts.t()('banks.subtitle')"
      >
        @if (isPremium()) {
          <span
            class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-accent/15 text-accent border border-accent/25"
          >
            <ui-icon name="stars" size="sm" />
            Premium
          </span>
        }
      </ui-page-header>

      <!-- Content (Blurred if not premium) -->
      <div
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl transition-all duration-300"
        [class.blur-md]="!isPremium()"
        [class.pointer-events-none]="!isPremium()"
        [class.select-none]="!isPremium()"
      >
        <!-- Mock Items for Lock Display if list empty -->
        @if (banks().length === 0 && !isPremium()) {
          @for (i of [1,2,3]; track i) {
            <div
              class="bg-surface-raised border border-border rounded-xl p-6 h-28 animate-pulse"
            ></div>
          }
        }

        @for (bank of banks(); track bank.code) {
          <div
            class="bg-surface-raised border border-border hover:border-lime-500/40 transition-colors rounded-xl p-5 shadow-sm flex items-center justify-between group"
          >
            <div class="flex items-center gap-3 min-w-0">
              <div
                class="w-10 h-10 rounded-lg bg-surface-sunken flex items-center justify-center border border-border text-ink shrink-0"
              >
                <ui-icon name="account_balance" size="md" />
              </div>
              <div class="min-w-0">
                <h3 class="text-sm font-semibold text-ink truncate">
                  {{ bank.displayName }}
                </h3>
                <p class="text-xs text-ink-muted">{{ bank.code }}</p>
              </div>
            </div>

            <div class="shrink-0">
              @if (!isConnected(bank.code)) {
                <button
                  uiButton
                  variant="secondary"
                  size="sm"
                  (click)="connectBank(bank)"
                  [disabled]="!!connectingBank()"
                >
                  {{ connectingBank() === bank.code ? '...' : ts.t()('banks.connect') }}
                </button>
              } @else {
                <button
                  uiButton
                  variant="danger"
                  size="sm"
                  (click)="disconnectBank(bank)"
                >
                  {{ ts.t()('banks.disconnect_btn') }}
                </button>
              }
            </div>
          </div>
        }
      </div>

      <!-- Premium Gate Overlay -->
      @if (!isPremium()) {
        <div class="absolute inset-0 z-10 flex items-center justify-center p-4">
          <div
            class="bg-surface/95 dark:bg-surface-sunken/95 backdrop-blur-md border border-accent/30 rounded-2xl p-8 max-w-md text-center shadow-2xl animate-fade-in space-y-5"
          >
            <div
              class="w-14 h-14 rounded-2xl bg-accent/20 border border-accent/40 flex items-center justify-center mx-auto text-accent shadow-sm"
            >
              <ui-icon name="stars" size="lg" />
            </div>

            <div>
              <h3 class="text-xl font-bold text-ink">
                {{ ts.t()('banks.premium_title') }}
              </h3>
              <p class="text-sm text-ink-muted mt-2 leading-relaxed">
                {{ ts.t()('banks.premium_desc') }}
              </p>
            </div>

            <div class="pt-2">
              <button
                uiButton
                variant="primary"
                size="lg"
                class="w-full flex items-center justify-center gap-2 font-bold shadow-lg shadow-accent/20"
                (click)="contactViaWhatsApp()"
              >
                <ui-icon name="chat" size="md" />
                {{ ts.t()('banks.whatsapp_cta') }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class BanksComponent implements OnInit {
  banks = signal<BankOption[]>([]);
  connectingBank = signal<string | null>(null);
  connectedBanks = signal<string[]>([]);

  authService = inject(AuthService);
  private apiService = inject(ApiService);
  ts = inject(TranslationService);
  private ns = inject(NotificationService);
  private dialogService = inject(UiDialogService);

  isPremium = this.authService.isPremium;

  constructor() {
    effect(() => {
      if (this.isPremium()) {
        this.refreshData();
      }
    });
  }

  ngOnInit() {
    this.refreshData();
  }

  refreshData() {
    this.loadBanks();
    this.checkStatus();
  }

  checkStatus() {
    if (!this.isPremium()) return;

    this.apiService.getBankStatus().subscribe({
      next: (res) => {
        let connected: string[] = [];
        if (Array.isArray(res)) {
          connected = res;
        } else if (res && typeof res === 'object') {
          const keys = Object.keys(res);
          if (keys.includes('connected') && Array.isArray(res['connected'])) {
            connected = res['connected'];
          } else {
            connected = keys;
          }
        }
        this.connectedBanks.set(connected);
      },
      error: (err) => {
        console.error('Failed to fetch bank status', err);
      },
    });
  }

  isConnected(bankCode: string): boolean {
    return this.connectedBanks().includes(bankCode);
  }

  loadBanks() {
    this.apiService.getBanks().subscribe({
      next: (res) => this.banks.set(res),
      error: () => {
        this.banks.set([
          { code: 'POPULAR', displayName: 'Banco Popular', email: '' },
          { code: 'BHD', displayName: 'Banco BHD', email: '' },
          { code: 'BANRESERVAS', displayName: 'Banreservas', email: '' },
          { code: 'QIK', displayName: 'Qik Banco', email: '' },
        ]);
      },
    });
  }

  contactViaWhatsApp() {
    const msg = this.ts.t()('banks.whatsapp_msg');
    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  }

  connectBank(bank: BankOption) {
    if (this.connectingBank()) return;
    this.connectingBank.set(bank.code);

    this.apiService.authorizeBank(bank.code).subscribe({
      next: (res) => {
        if (res.authUrl) {
          window.location.href = res.authUrl;
        } else {
          this.ns.show('banks.unexpected_response', 'error');
          this.connectingBank.set(null);
        }
      },
      error: (err) => {
        this.ns.show('banks.connect_failed', 'error');
        console.error(err);
        this.connectingBank.set(null);
      },
    });
  }

  async disconnectBank(bank: BankOption) {
    const confirmed = await this.dialogService.confirm({
      title: this.ts.t()('banks.disconnect_title'),
      message: `${this.ts.t()('banks.disconnect_confirm')} "${bank.displayName}"? ${this.ts.t()('banks.disconnect_desc')}`,
      confirmLabel: this.ts.t()('banks.disconnect_btn'),
      cancelLabel: this.ts.t()('action.cancel'),
      tone: 'danger',
    });

    if (confirmed) {
      this.apiService.disconnectBank(bank.code).subscribe({
        next: () => {
          this.ns.show(this.ts.translate('banks.disconnect_success'), 'success');
          this.refreshData();
        },
        error: () => {
          this.ns.show(this.ts.translate('banks.disconnect_failed'), 'error');
        },
      });
    }
  }
}
