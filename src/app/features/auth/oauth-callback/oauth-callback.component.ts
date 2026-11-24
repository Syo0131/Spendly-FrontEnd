import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div class="glass-card p-8 max-w-md w-full text-center">
        <!-- Loading State -->
        <div *ngIf="loading()" class="space-y-4">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p class="text-gray-600 dark:text-gray-300">Procesando conexión bancaria...</p>
        </div>

        <!-- Success State -->
        <div *ngIf="!loading() && success()" class="space-y-6 animate-fade-in">
          <div
            class="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto"
          >
            <span class="material-icons text-4xl text-green-600 dark:text-green-400"
              >check_circle</span
            >
          </div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">¡Conexión Exitosa!</h2>
          <p class="text-gray-600 dark:text-gray-300">
            Los siguientes bancos se han conectado correctamente:<br />
            <span class="font-semibold text-primary block mt-2">{{ connectedBanks() }}</span>
          </p>
          <button
            (click)="goToDashboard()"
            class="w-full py-3 px-4 bg-primary text-white rounded-xl transition-colors font-medium shadow-lg shadow-primary/25"
          >
            Ir al Dashboard
          </button>
        </div>

        <!-- Error State -->
        <div *ngIf="!loading() && !success()" class="space-y-6 animate-fade-in">
          <div
            class="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto"
          >
            <span class="material-icons text-4xl text-red-600 dark:text-red-400"
              >error_outline</span
            >
          </div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Error de Conexión</h2>
          <p
            class="text-red-500 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg"
          >
            {{ errorMessage() }}
          </p>
          <button
            (click)="retry()"
            class="w-full py-3 px-4 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-white rounded-xl hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors font-medium"
          >
            Intentar de nuevo
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .glass-card {
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(10px);
        border-radius: 1.5rem;
        border: 1px solid rgba(255, 255, 255, 0.2);
      }
      :host-context(.dark) .glass-card {
        background: rgba(17, 24, 39, 0.8);
        border-color: rgba(255, 255, 255, 0.1);
      }
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
export class OAuthCallbackComponent implements OnInit {
  loading = signal<boolean>(true);
  success = signal<boolean>(false);
  connectedBanks = signal<string>('');
  errorMessage = signal<string>('');

  constructor(
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe({
      next: (params) => {
        // Simulate a small delay for better UX so the spinner is seen
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
    const errorMessages: { [key: string]: string } = {
      invalid_state: 'El estado de autenticación es inválido.',
      invalid_bank_code: `El código del banco "${bank}" es inválido.`,
      no_banks: 'No se especificaron bancos para conectar.',
      unsupported_bank: `El banco "${bank}" no está soportado.`,
      invalid_user_id: 'ID de usuario inválido.',
      processing_error: `Error al procesar: ${message || 'Error desconocido'}`,
    };

    return errorMessages[error] || message || 'Error desconocido al conectar bancos.';
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  retry() {
    this.router.navigate(['/banks']);
  }
}
