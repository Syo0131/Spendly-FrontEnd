import { Component, OnInit, signal, inject, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { BankOption } from '../../core/models/api.models';
import { TranslationService } from '../../core/services/translation.service';

@Component({
  selector: 'app-banks',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-8 animate-fade-in space-y-8 relative min-h-[80vh]">
      <!-- Header -->
      <div class="text-center">
        <span class="material-icons-outlined text-6xl text-primary mb-4">account_balance</span>
        <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {{ ts.t()('banks.title') }}
        </h2>
        <p class="text-gray-500 dark:text-gray-400">{{ ts.t()('banks.subtitle') }}</p>
      </div>

      <!-- Content (Blurred if not premium) -->
      <div
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto transition-all duration-500"
        [class.blur-md]="!isPremium()"
        [class.pointer-events-none]="!isPremium()"
        [class.select-none]="!isPremium()"
      >
        <!-- Mock Items for Lock Display if list empty -->
        <ng-container *ngIf="banks().length === 0 && !isPremium()">
          <div class="glass-card p-6 h-32 animate-pulse bg-gray-200 dark:bg-white/5"></div>
          <div class="glass-card p-6 h-32 animate-pulse bg-gray-200 dark:bg-white/5"></div>
          <div class="glass-card p-6 h-32 animate-pulse bg-gray-200 dark:bg-white/5"></div>
        </ng-container>

        <div
          *ngFor="let bank of banks(); trackBy: trackByCode"
          class="glass-card p-6 flex items-center justify-between bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-white dark:hover:bg-slate-800/70 transition-colors cursor-pointer group"
        >
          <div class="flex items-center space-x-3">
            <div
              class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xl"
            >
              🏦
            </div>
            <div>
              <h3 class="text-gray-900 dark:text-white font-semibold">{{ bank.displayName }}</h3>
              <p class="text-xs text-gray-500">{{ bank.code }}</p>
            </div>
          </div>
          <div class="flex gap-2">
            <button
              *ngIf="!isConnected(bank.code)"
              (click)="connectBank(bank)"
              class="transition-opacity font-medium text-sm"
              [class.opacity-0]="connectingBank() !== bank.code"
              [class.group-hover:opacity-100]="connectingBank() !== bank.code"
              [class.text-primary]="connectingBank() !== bank.code"
              [class.text-gray-400]="connectingBank() === bank.code"
              [disabled]="!!connectingBank()"
            >
              {{ connectingBank() === bank.code ? 'Connecting...' : ts.t()('banks.connect') }}
            </button>

            <button
              *ngIf="isConnected(bank.code)"
              (click)="disconnectBank(bank)"
              class="text-red-500 hover:text-red-600 font-medium text-sm transition-colors"
            >
              Disconnect
            </button>
          </div>
        </div>
      </div>

      <!-- Premium Lock Overlay -->
      <div
        *ngIf="!isPremium()"
        class="absolute inset-0 z-10 flex items-center justify-center -mt-20"
      >
        <div
          class="glass-card p-8 max-w-md text-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-amber-500/30 shadow-2xl shadow-amber-500/10 animate-fade-in-up"
        >
          <div
            class="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/30"
          >
            <span class="material-icons text-3xl text-white">lock</span>
          </div>

          <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {{ ts.t()('banks.premium_title') }}
          </h3>
          <p class="text-gray-500 dark:text-gray-300 mb-6">
            {{ ts.t()('banks.premium_desc') }}
          </p>

          <div class="space-y-3">
            <button
              (click)="unlockPremium()"
              class="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transform hover:scale-[1.02] transition-all"
            >
              {{ ts.t()('banks.premium_btn') }}
            </button>
            <button class="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              {{ ts.t()('banks.restore') }}
            </button>
          </div>
        </div>
      </div>
      <!-- Disconnect Modal -->
      <div
        *ngIf="showDisconnectModal()"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      >
        <div
          class="glass-card w-full max-w-sm p-6 relative animate-scale-in bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 shadow-2xl text-center"
        >
          <div
            class="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4"
          >
            <span class="material-icons-outlined text-3xl text-red-500">link_off</span>
          </div>
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Disconnect Bank?</h3>
          <p class="text-gray-500 dark:text-gray-400 mb-6 text-sm">
            Are you sure you want to disconnect
            <span class="font-bold text-gray-700 dark:text-gray-300">{{
              bankToDisconnect()?.displayName
            }}</span>
            ? This will stop automatic transaction updates.
          </p>
          <div class="flex space-x-3 justify-center">
            <button
              (click)="cancelDisconnect()"
              class="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              (click)="confirmDisconnect()"
              class="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold shadow-lg shadow-red-500/30 transition-all hover:scale-[1.02]"
            >
              Disconnect
            </button>
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
        animation: fadeInUp 0.5s ease-out;
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
      .animate-scale-in {
        animation: scaleIn 0.2s ease-out forwards;
      }
      @keyframes scaleIn {
        from {
          opacity: 0;
          transform: scale(0.95);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }
    `,
  ],
})
export class BanksComponent implements OnInit {
  banks = signal<BankOption[]>([]);
  connectingBank = signal<string | null>(null);

  // Inject Injectables
  public authService = inject(AuthService);
  private apiService = inject(ApiService);
  public ts = inject(TranslationService);

  // Alias the global signal directly! No flickering.
  isPremium = this.authService.isPremium;

  constructor() {
    effect(() => {
      if (this.isPremium()) {
        this.refreshData();
      }
    });
  }

  connectedBanks = signal<string[]>([]);

  ngOnInit() {
    this.refreshData();
  }

  trackByCode(index: number, item: any): string {
    return item.code;
  }

  refreshData() {
    this.loadBanks();
    this.checkStatus();
  }

  checkStatus() {
    if (!this.isPremium()) return; // Don't call if not premium

    this.apiService.getBankStatus().subscribe({
      next: (res) => {
        console.log('Bank Status Response:', res); // DEBUG

        let connected: string[] = [];
        if (Array.isArray(res)) {
          connected = res;
        } else if (res && typeof res === 'object') {
          // If response looks like { "POPULAR": true }, keys are codes.
          // If response looks like { "connected": ["POPULAR"] }, we need that check.
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
      error: (err) => {
        // Fallback for demo if API fails
        this.banks.set([
          { code: 'POPULAR', displayName: 'Banco Popular', email: '' },
          { code: 'BHD', displayName: 'Banco BHD', email: '' },
          { code: 'BANRESERVAS', displayName: 'Banreservas', email: '' },
          { code: 'QIK', displayName: 'Qik Banco', email: '' },
        ]);
      },
    });
  }

  unlockPremium() {
    // Mock Unlock
    if (confirm('Simulate Payment Success?')) {
      this.authService.isPremium.set(true);
      localStorage.setItem('spendly_premium', 'true');
      this.checkStatus(); // Immediately refresh status
    }
  }

  connectBank(bank: BankOption) {
    if (this.connectingBank()) return;
    this.connectingBank.set(bank.code);

    this.apiService.authorizeBank(bank.code).subscribe({
      next: (res) => {
        if (res.authUrl) {
          window.location.href = res.authUrl;
        } else {
          alert('Unexpected response from server.');
          this.connectingBank.set(null);
        }
      },
      error: (err) => {
        alert('❌ Failed to connect to bank. Please try again.');
        console.error(err);
        this.connectingBank.set(null);
      },
    });
  }

  /* Modal State */
  showDisconnectModal = signal(false);
  bankToDisconnect = signal<BankOption | null>(null);

  disconnectBank(bank: BankOption) {
    this.bankToDisconnect.set(bank);
    this.showDisconnectModal.set(true);
  }

  confirmDisconnect() {
    const bank = this.bankToDisconnect();
    if (!bank) return;

    this.apiService.disconnectBank(bank.code).subscribe({
      next: () => {
        // alert(`Disconnected ${bank.displayName}`); // Optional: replaced by UI refresh
        this.cancelDisconnect();
        this.refreshData();
      },
      error: () => {
        alert('Failed to disconnect');
        this.cancelDisconnect();
      },
    });
  }

  cancelDisconnect() {
    this.showDisconnectModal.set(false);
    this.bankToDisconnect.set(null);
  }
}
