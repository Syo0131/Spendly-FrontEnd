import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IconComponent,
  ButtonComponent,
  BadgeComponent,
  AmountComponent,
  ProgressBarComponent,
  SpinnerComponent,
  SkeletonComponent,
  ToggleComponent,
  FieldLabelComponent,
} from '../atoms';
import {
  FormFieldComponent,
  CurrencyInputComponent,
  SegmentedControlComponent,
  CategoryBadgeComponent,
  ListRowComponent,
  EmptyStateComponent,
  PageHeaderComponent,
  PaginationComponent,
  MonthSelectorComponent,
} from '../molecules';
import {
  UiDialogService,
  CategoryPickerComponent,
  ActionSheetComponent,
} from '../organisms';
import { Category } from '../../../core/models/api.models';

@Component({
  selector: 'ui-showcase',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IconComponent,
    ButtonComponent,
    BadgeComponent,
    AmountComponent,
    ProgressBarComponent,
    SpinnerComponent,
    SkeletonComponent,
    ToggleComponent,
    FieldLabelComponent,
    FormFieldComponent,
    CurrencyInputComponent,
    SegmentedControlComponent,
    CategoryBadgeComponent,
    ListRowComponent,
    EmptyStateComponent,
    PageHeaderComponent,
    PaginationComponent,
    MonthSelectorComponent,
    CategoryPickerComponent,
    ActionSheetComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-canvas text-ink p-6 md:p-12 transition-colors">
      <div class="max-w-5xl mx-auto space-y-12">
        <!-- Top Toolbar -->
        <div class="flex items-center justify-between pb-6 border-b border-border">
          <div>
            <h1 class="text-3xl font-extrabold tracking-tight font-heading text-fg-default">
              Spendly UI Component Showcase
            </h1>
            <p class="text-sm text-ink-muted mt-1">
              Swiss Ledger + Lima Eléctrica Design System tokens & components
            </p>
          </div>
          <div class="flex items-center gap-3">
            <button
              uiButton
              variant="secondary"
              size="sm"
              (click)="toggleTheme()"
            >
              <ui-icon [name]="isDark() ? 'light_mode' : 'dark_mode'" size="sm" />
              <span>{{ isDark() ? 'Light Mode' : 'Dark Mode' }}</span>
            </button>
          </div>
        </div>

        <!-- Section 1: Page Header & Typography -->
        <section class="space-y-4">
          <h2 class="text-xs uppercase tracking-wider font-mono text-ink-muted">01. Layout & Header</h2>
          <ui-page-header
            title="Presupuestos Activos"
            subtitle="Controla tus techos de gasto mensuales y anuales"
          >
            <button uiButton variant="secondary" size="sm" uiHeaderActions>Descargar</button>
            <button uiButton variant="primary" size="sm" uiHeaderActions>Nuevo Límite</button>
          </ui-page-header>
        </section>

        <!-- Section 2: Atoms (Buttons) -->
        <section class="space-y-4">
          <h2 class="text-xs uppercase tracking-wider font-mono text-ink-muted">02. Buttons (Atoms)</h2>
          <div class="p-6 rounded-2xl bg-surface border border-border space-y-6">
            <div class="flex flex-wrap gap-3 items-center">
              <button uiButton variant="primary">Primary</button>
              <button uiButton variant="secondary">Secondary</button>
              <button uiButton variant="ghost">Ghost</button>
              <button uiButton variant="danger">Danger</button>
              <button uiButton variant="primary" [loading]="true">Loading</button>
              <button uiButton variant="primary" [disabled]="true">Disabled</button>
            </div>
            <div class="flex flex-wrap gap-3 items-center">
              <button uiButton variant="primary" size="sm">Small</button>
              <button uiButton variant="primary" size="md">Medium</button>
              <button uiButton variant="primary" size="lg">Large</button>
            </div>
          </div>
        </section>

        <!-- Section 3: Atoms (Badges & Amounts) -->
        <section class="space-y-4">
          <h2 class="text-xs uppercase tracking-wider font-mono text-ink-muted">03. Badges & Amounts</h2>
          <div class="p-6 rounded-2xl bg-surface border border-border space-y-6">
            <div class="flex flex-wrap gap-3 items-center">
              <ui-badge tone="neutral">Default</ui-badge>
              <ui-badge tone="income">Income</ui-badge>
              <ui-badge tone="expense">Expense</ui-badge>
              <ui-badge tone="warning">Warning</ui-badge>
              <ui-badge tone="critical">Critical</ui-badge>
            </div>
            <div class="flex flex-wrap gap-6 items-center">
              <div>
                <span class="text-xs text-ink-muted block mb-1">Expense:</span>
                <ui-amount [value]="142300" type="expense" size="lg" />
              </div>
              <div>
                <span class="text-xs text-ink-muted block mb-1">Income:</span>
                <ui-amount [value]="250000" type="income" size="lg" />
              </div>
              <div>
                <span class="text-xs text-ink-muted block mb-1">Neutral:</span>
                <ui-amount [value]="50000" type="neutral" size="lg" />
              </div>
            </div>
          </div>
        </section>

        <!-- Section 4: Progress Bars & Skeletons -->
        <section class="space-y-4">
          <h2 class="text-xs uppercase tracking-wider font-mono text-ink-muted">04. Feedback & Indicators</h2>
          <div class="p-6 rounded-2xl bg-surface border border-border space-y-6">
            <div class="space-y-3 max-w-md">
              <div class="flex justify-between text-xs text-ink-muted">
                <span>Budget Status OK (50%)</span>
              </div>
              <ui-progress-bar [percent]="50" status="ok" label="Budget Status OK" />

              <div class="flex justify-between text-xs text-ink-muted pt-2">
                <span>Budget Status Warning (80%)</span>
              </div>
              <ui-progress-bar [percent]="80" status="warning" label="Budget Status Warning" />

              <div class="flex justify-between text-xs text-ink-muted pt-2">
                <span>Budget Status Critical (110%)</span>
              </div>
              <ui-progress-bar [percent]="110" status="critical" label="Budget Status Critical" />
            </div>

            <div class="flex items-center gap-6 pt-4 border-t border-border">
              <ui-spinner size="sm" />
              <ui-spinner size="md" />
              <ui-spinner size="lg" />
              <div class="flex items-center gap-2">
                <ui-toggle [(ngModel)]="toggleValue" label="Notificaciones push" />
              </div>
            </div>

            <div class="space-y-2 max-w-sm pt-2">
              <ui-skeleton class="w-48 h-5" />
              <ui-skeleton class="w-full h-10" />
            </div>
          </div>
        </section>

        <!-- Section 5: Form Molecules -->
        <section class="space-y-4">
          <h2 class="text-xs uppercase tracking-wider font-mono text-ink-muted">05. Form Molecules</h2>
          <div class="p-6 rounded-2xl bg-surface border border-border grid grid-cols-1 md:grid-cols-2 gap-6">
            <ui-form-field label="Monto a registrar" fieldId="amount_demo" hint="En pesos dominicanos (DOP)">
              <ui-currency-input
                inputId="amount_demo"
                [(ngModel)]="currencyDemo"
              />
            </ui-form-field>

            <ui-form-field label="Tipo de flujo" fieldId="flow_type">
              <ui-segmented-control
                [options]="segmentedOptions"
                [(ngModel)]="selectedFlow"
              />
            </ui-form-field>

            <div>
              <ui-field-label for="field_demo">Etiqueta destacada</ui-field-label>
              <input
                id="field_demo"
                type="text"
                placeholder="Ejemplo de campo libre..."
                class="mt-1.5 w-full h-10 px-3.5 rounded-lg bg-surface border border-border text-ink placeholder:text-ink-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring text-sm"
              />
            </div>

            <div class="md:col-span-2">
              <ui-category-picker
                label="Categoría de gasto"
                placeholder="Seleccionar categoría..."
                [categories]="sampleCategories"
                [(ngModel)]="selectedCategory"
              />
            </div>
          </div>
        </section>

        <!-- Section 6: Display Molecules & Rows -->
        <section class="space-y-4">
          <h2 class="text-xs uppercase tracking-wider font-mono text-ink-muted">06. Display Molecules</h2>
          <div class="p-6 rounded-2xl bg-surface border border-border space-y-6">
            <div class="flex flex-wrap gap-2">
              <ui-category-badge name="Supermercado" color="#10b981" icon="shopping_cart" />
              <ui-category-badge name="Vivienda" color="#6366f1" icon="home" />
              <ui-category-badge name="Vehículo" color="#f59e0b" icon="directions_car" />
              <ui-category-badge name="Restaurante" color="#ec4899" icon="restaurant" />
              <ui-category-badge name="Alimentación" color="#22c55e" icon="🍔" />
              <ui-category-badge name="Mantenimiento" color="#94a3b8" icon="🛠️" size="sm" />
            </div>

            <div class="space-y-3">
              <ui-list-row [interactive]="true" (rowClick)="onRowClick()">
                <ui-category-badge uiRowLeading name="Supermercado" color="#10b981" icon="shopping_cart" size="sm" />
                <div class="min-w-0">
                  <p class="font-medium text-fg-default truncate">Compras Quincena Bravo</p>
                  <p class="text-xs text-fg-muted">24 Nov 2026</p>
                </div>
                <ui-amount uiRowTrailing [value]="12450" type="expense" />
                <div uiRowBelow class="pt-1">
                  <ui-progress-bar [percent]="65" status="ok" label="Gasto en supermercado" thickness="thin" />
                </div>
              </ui-list-row>
            </div>

            <!-- Month selector -->
            <div class="pt-4 flex items-center justify-between">
              <span class="text-sm font-medium text-ink-muted">Month Selector:</span>
              <ui-month-selector [(value)]="selectedDate" />
            </div>

            <!-- Pagination -->
            <div class="pt-4">
              <ui-pagination
                [page]="currentPage()"
                [totalPages]="5"
                (pageChange)="currentPage.set($event)"
              />
            </div>
          </div>
        </section>

        <!-- Section 7: Overlays & Dialogs -->
        <section class="space-y-4">
          <h2 class="text-xs uppercase tracking-wider font-mono text-ink-muted">07. Overlays & Dialog Service</h2>
          <div class="p-6 rounded-2xl bg-surface border border-border flex flex-wrap gap-4 items-center">
            <button uiButton variant="danger" (click)="testConfirm()">
              Probar Confirm Dialog
            </button>
            <button uiButton variant="secondary" (click)="showActionSheet.set(true)">
              Abrir Action Sheet
            </button>

            @if (confirmResult() !== null) {
              <span class="text-sm font-medium">
                Resultado confirm:
                <strong [class.text-expense]="!confirmResult()" [class.text-accent]="confirmResult()">
                  {{ confirmResult() ? 'CONFIRMADO' : 'CANCELADO' }}
                </strong>
              </span>
            }
          </div>
        </section>

        <!-- Section 8: Empty State -->
        <section class="space-y-4">
          <h2 class="text-xs uppercase tracking-wider font-mono text-ink-muted">08. Empty State</h2>
          <ui-empty-state
            icon="savings"
            title="Sin presupuestos configurados"
            description="Crea un límite mensual o anual para mantener tus gastos bajo control."
          >
            <button uiButton variant="primary" uiEmptyAction>Crear Presupuesto</button>
          </ui-empty-state>
        </section>

        <!-- Action sheet container for testing -->
        @if (showActionSheet()) {
          <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end lg:items-center justify-center p-0 lg:p-4">
            <ui-action-sheet
              title="Opciones rápidas"
              (closed)="showActionSheet.set(false)"
            >
              <div class="space-y-3">
                <p class="text-sm text-ink-muted">Menú rápido accesible en móvil como bottom sheet y en desktop como modal.</p>
                <button uiButton variant="secondary" class="w-full" (click)="showActionSheet.set(false)">
                  Entendido
                </button>
              </div>
            </ui-action-sheet>
          </div>
        }
      </div>
    </div>
  `,
})
export class UiShowcaseComponent {
  private dialog = inject(UiDialogService);

  isDark = signal<boolean>(
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  );
  toggleValue = signal<boolean>(true);
  currencyDemo = signal<number | null>(45200);
  selectedFlow = signal<string>('expense');
  selectedCategory = signal<number | null>(1);
  selectedDate = signal<Date>(new Date());
  currentPage = signal<number>(0);
  confirmResult = signal<boolean | null>(null);
  showActionSheet = signal<boolean>(false);

  segmentedOptions = [
    { value: 'expense', label: 'Gasto' },
    { value: 'income', label: 'Ingreso' },
  ];

  sampleCategories: Category[] = [
    { id: 1, name: 'Supermercado', color: '#10b981', icons: 'shopping_cart' },
    { id: 2, name: 'Vivienda', color: '#6366f1', icons: 'home' },
    { id: 3, name: 'Transporte', color: '#f59e0b', icons: 'directions_car' },
    { id: 4, name: 'Restaurantes', color: '#ec4899', icons: 'restaurant' },
    // The API stores category icons as emojis.
    { id: 5, name: 'Alimentación', color: '#22c55e', icons: '🍔' },
    { id: 6, name: 'Mantenimiento', color: '#94a3b8', icons: '🛠️' },
  ];

  toggleTheme(): void {
    if (typeof document !== 'undefined') {
      const isCurrentlyDark = document.documentElement.classList.contains('dark');
      if (isCurrentlyDark) {
        document.documentElement.classList.remove('dark');
        this.isDark.set(false);
      } else {
        document.documentElement.classList.add('dark');
        this.isDark.set(true);
      }
    }
  }

  async testConfirm(): Promise<void> {
    const res = await this.dialog.confirm({
      title: '¿Eliminar transacción?',
      message: 'Esta acción borrará permanentemente el registro seleccionado de tu historial.',
      confirmLabel: 'Sí, eliminar',
      cancelLabel: 'Cancelar',
      tone: 'danger',
    });
    this.confirmResult.set(res);
  }

  onRowClick(): void {
    console.log('Row clicked');
  }
}
