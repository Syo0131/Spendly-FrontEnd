import { Component, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-surface p-4">
      <div class="rounded-3xl border border-divider bg-surface-2 p-8 max-w-md w-full text-center shadow-[0_20px_60px_-20px_rgba(43,38,32,0.25)]">
        <!-- Loading State -->
        <div *ngIf="loading()" class="space-y-4">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p class="text-content-muted">Procesando conexión bancaria...</p>
        </div>

        <!-- Success State -->
        <div *ngIf="!loading() && success()" class="space-y-6 animate-fade-in">
          <div
            class="w-16 h-16 bg-success/12 rounded-full flex items-center justify-center mx-auto"
          >
            <app-icon
              name="check_circle"
              [size]="40"
              class="text-success"
            />
          </div>
          <h2 class="text-2xl font-bold text-content">¡Conexión Exitosa!</h2>
          <p class="text-content-muted">
            Los siguientes bancos se han conectado correctamente:<br />
            <span class="font-semibold text-primary-ink block mt-2">{{ connectedBanks() }}</span>
          </p>
          <button
            (click)="goToDashboard()"
            class="w-full py-3 px-4 bg-primary text-primary-on rounded-xl hover:bg-primary-dark transition-colors font-medium shadow-lg shadow-primary/25"
          >
            Ir al Dashboard
          </button>
        </div>

        <!-- Error State -->
        <div *ngIf="!loading() && !success()" class="space-y-6 animate-fade-in">
          <div
            class="w-16 h-16 bg-expense/12 rounded-full flex items-center justify-center mx-auto"
          >
            <app-icon
              name="error_outline"
              [size]="40"
              class="text-expense"
            />
          </div>
          <h2 class="text-2xl font-bold text-content">Error de Conexión</h2>
          <p
            class="text-expense text-sm bg-expense/10 p-3 rounded-lg"
          >
            {{ errorMessage() }}
          </p>
          <button
            (click)="retry()"
            class="w-full py-3 px-4 bg-surface-3 text-content rounded-xl hover:bg-divider transition-colors font-medium"
          >
            Intentar de nuevo
          </button>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [],
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
