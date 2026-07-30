import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { TranslationService } from '../../core/services/translation.service';
import { NotificationService } from '../../core/services/notification.service';
import { SavingGoalsResponse, ContributionResponse } from '../../core/models/api.models';
import { DatePickerComponent } from '../../shared/components/date-picker/date-picker.component';
import { GoalStateService } from '../../core/services/goal-state.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { UiCardComponent } from '../../shared/components/ui/ui-card.component';
import { UiButtonComponent } from '../../shared/components/ui/ui-button.component';
import { UiEmptyStateComponent } from '../../shared/components/ui/ui-empty-state.component';

@Component({
  selector: 'app-goals',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DatePickerComponent,
    IconComponent,
    UiCardComponent,
    UiButtonComponent,
    UiEmptyStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 pb-24 md:pb-6 animate-fade-in-up">
      <!-- Header -->
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-3xl font-display font-semibold text-content">
            {{ ts.t()('goals.title') }}
          </h1>
          <p class="text-content-muted">
            {{ ts.t()('goals.subtitle') }}
          </p>
        </div>
        <button
          (click)="openModal()"
          class="bg-primary hover:bg-primary-dark text-primary-on px-4 py-2 rounded-xl font-medium shadow-lg shadow-primary/30 transition-all hover:scale-105 flex items-center gap-2"
        >
          <app-icon name="add" [size]="24" />
          <span class="hidden md:inline">{{ ts.t()('goals.add') }}</span>
        </button>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading()" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          *ngFor="let i of [1, 2, 3]"
          class="h-48 rounded-2xl bg-surface-3 animate-pulse"
        ></div>
      </div>

      <!-- Empty State -->
      @if (!isLoading() && goals().length === 0) {
      <ui-card [padded]="false">
        <ui-empty-state
          icon="flag"
          [title]="ts.t()('goals.empty_title')"
          [description]="ts.t()('goals.empty_desc')"
        >
          <ui-button (click)="openModal()">
            <app-icon name="add" [size]="18" />
            {{ ts.t()('goals.add') }}
          </ui-button>
        </ui-empty-state>
      </ui-card>
      }

      <!-- Goals Grid -->
      <div
        *ngIf="!isLoading() && goals().length > 0"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <div
          *ngFor="let goal of goals()"
          class="glass-card p-6 relative group border border-divider"
        >
          <!-- Menu Button -->
          <button
            (click)="editGoal(goal)"
            class="absolute top-4 right-4 p-2 text-content-subtle hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
          >
            <app-icon name="edit" [size]="24" />
          </button>

          <!-- History Button -->
          <button
            (click)="openHistory(goal)"
            class="absolute top-4 right-14 p-2 text-content-subtle hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
            title="History"
          >
            <app-icon name="history" [size]="24" />
          </button>

          <div class="mb-4">
            <div
              class="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-4 text-orange-500"
            >
              <app-icon name="savings" [size]="28" />
            </div>
            <h3 class="text-xl font-bold text-content mb-1">{{ goal.name }}</h3>
            <p class="text-sm text-content-muted">
              {{ ts.t()('goals.target') }}: {{ goal.targetDate | date }}
            </p>
          </div>

          <!-- Progress -->
          <div class="mb-2 flex justify-between items-end">
            <span class="text-xs font-medium text-content-muted">
              {{ calcProgress(goal) | number : '1.0-0' }}%
            </span>
            <span class="text-sm font-bold text-content">
              DOP {{ goal.currentAmount | number : '1.2-2' }} /
              {{ goal.targetAmount | number : '1.2-2' }}
            </span>
          </div>

          <div class="w-full bg-surface-3 rounded-full h-3 mb-6 overflow-hidden">
            <div
              class="bg-primary h-3 rounded-full transition-all duration-1000 ease-out"
              [style.width.%]="calcProgress(goal)"
            ></div>
          </div>

          <!-- Actions Footer -->
          <div
            class="flex items-center gap-3 mt-auto pt-4 border-t border-divider"
          >
            <button
              (click)="addFunds(goal)"
              class="flex-1 py-2 text-sm font-medium text-primary bg-primary/10 dark:bg-primary/20 rounded-lg hover:bg-primary/20 dark:hover:bg-primary/30 transition-colors"
            >
              + {{ ts.t()('goals.add_funds') }}
            </button>
            <button
              (click)="deleteGoal(goal)"
              class="p-2 text-expense hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <app-icon name="delete" [size]="20" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- History Modal -->
    @defer (when showHistoryModal()) {
    <div
      *ngIf="showHistoryModal()"
      class="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      (click)="closeHistoryModal()"
    >
      <div
        class="bg-surface-2 rounded-2xl shadow-2xl border border-divider w-full max-w-lg md:max-w-2xl max-h-[80vh] flex flex-col animate-scale-in"
        (click)="$event.stopPropagation()"
      >
        <div
          class="p-6 border-b border-divider flex justify-between items-center"
        >
          <div>
            <h2 class="text-xl font-bold text-content">Contribution History</h2>
            <p class="text-sm text-content-muted">{{ selectedGoalName() }}</p>
          </div>
          <button
            (click)="closeHistoryModal()"
            class="text-content-muted hover:text-content-muted"
          >
            <app-icon name="close" [size]="24" />
          </button>
        </div>

        <div class="p-6 overflow-y-auto no-scrollbar">
          <div
            *ngIf="contributions().length === 0"
            class="text-center py-8 text-content-muted"
          >
            <app-icon name="history" [size]="40" class="mb-2 opacity-50 mx-auto" />
            <p>No contributions yet.</p>
          </div>

          <div class="space-y-4">
            <div
              *ngFor="let item of contributions()"
              class="flex items-center justify-between p-4 rounded-xl bg-surface-3 border border-divider hover:border-primary/30 transition-colors group"
            >
              <div class="flex items-center gap-4">
                <div
                  class="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400"
                >
                  <app-icon name="arrow_upward" [size]="20" />
                </div>
                <div>
                  <p class="font-bold text-content">
                    + {{ item.amount | number : '1.2-2' }}
                  </p>
                  <p class="text-xs text-content-muted">
                    {{ item.createdAt | date : 'mediumDate' }} •
                    {{ item.createdAt | date : 'shortTime' }}
                  </p>
                  <p *ngIf="item.description" class="text-sm text-content-muted mt-1">
                    {{ item.description }}
                  </p>
                </div>
              </div>

              <button
                (click)="deleteContributionCheck(item)"
                class="opacity-0 group-hover:opacity-100 p-2 text-expense hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                title="Delete Contribution"
              >
                <app-icon name="delete_outline" [size]="24" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    }

    <!-- Create/Edit Modal -->
    @defer (when showModal()) {
    <div
      *ngIf="showModal()"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      (click)="closeModal()"
    >
      <div
        class="bg-surface-2 rounded-2xl shadow-2xl border border-divider w-full max-w-md animate-scale-in"
        (click)="$event.stopPropagation()"
      >
        <div
          class="p-6 border-b border-divider flex justify-between items-center"
        >
          <h2 class="text-xl font-bold text-content">
            {{ getModalTitle() }}
          </h2>
          <button
            (click)="closeModal()"
            class="text-content-muted hover:text-content-muted"
          >
            <app-icon name="close" [size]="24" />
          </button>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="p-6 space-y-4">
          <!-- Add Funds Mode -->
          <ng-container *ngIf="modalMode() === 'add_funds'">
            <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl flex items-center gap-3 mb-2">
              <app-icon name="savings" [size]="28" class="text-blue-500" />
              <div>
                <p
                  class="text-xs text-uppercase text-content-muted font-bold tracking-wider"
                >
                  META
                </p>
                <p class="font-bold text-content">{{ selectedGoalName() }}</p>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-content-muted mb-1">
                {{ ts.t()('trans.amount') }} (RD$)
              </label>
              <input
                type="number"
                formControlName="contributionAmount"
                placeholder="0.00"
                (keypress)="validateNumber($event)"
                (blur)="formatAmount('contributionAmount')"
                class="no-spinner w-full bg-surface-3 border border-divider rounded-xl px-4 py-3 text-2xl font-bold text-content focus:ring-2 focus:ring-primary/50 text-center"
              />
            </div>

            <div class="mt-4">
              <label class="block text-sm font-medium text-content-muted mb-1">
                {{ ts.t()('forms.description_optional') }}
              </label>
              <input
                type="text"
                formControlName="contributionDescription"
                placeholder="e.g. Weekly Savings"
                class="w-full bg-surface-3 border border-divider rounded-xl px-4 py-2.5 text-content focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </ng-container>

          <!-- Create/Edit Mode -->
          <ng-container *ngIf="modalMode() !== 'add_funds'">
            <!-- Name -->
            <div>
              <label class="block text-sm font-medium text-content-muted mb-1">
                {{ ts.t()('goals.field_name') }}
              </label>
              <input
                type="text"
                formControlName="name"
                class="w-full bg-surface-3 border border-divider rounded-xl px-4 py-2.5 text-content focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <!-- Target Amount -->
            <div>
              <label class="block text-sm font-medium text-content-muted mb-1">
                {{ ts.t()('goals.field_target') }}
              </label>
              <input
                type="number"
                formControlName="targetAmount"
                (keypress)="validateNumber($event)"
                (blur)="formatAmount('targetAmount')"
                class="no-spinner w-full bg-surface-3 border border-divider rounded-xl px-4 py-2.5 text-content focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <!-- Target Date -->
            <div class="z-20 relative">
              <label class="block text-sm font-medium text-content-muted mb-1">
                {{ ts.t()('goals.field_date') }}
              </label>
              <app-date-picker formControlName="targetDate"></app-date-picker>
            </div>
          </ng-container>

          <div class="flex gap-3 pt-4 relative z-0">
            <button
              type="button"
              (click)="closeModal()"
              class="flex-1 py-3 rounded-xl border border-divider font-medium hover:bg-surface-3 transition-colors"
            >
              {{ ts.t()('action.cancel') }}
            </button>
            <button
              type="submit"
              [disabled]="
                isSubmitting() ||
                (modalMode() !== 'add_funds' && form.invalid) ||
                (modalMode() === 'add_funds' &&
                  (!form.get('contributionAmount')?.value ||
                    form.get('contributionAmount')?.value <= 0))
              "
              class="flex-1 py-3 rounded-xl bg-primary text-primary-on font-bold shadow-lg shadow-primary/25 hover:bg-primary-dark transition-all disabled:opacity-50"
            >
              {{ isSubmitting() ? '...' : ts.t()('action.save') }}
            </button>
          </div>
        </form>
      </div>
    </div>
    }

    <!-- Delete Confirmation Modal (Common) -->
    @defer (when showDeleteModal()) {
    <div
      *ngIf="showDeleteModal()"
      class="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      (click)="closeDeleteModal()"
    >
      <div
        class="bg-surface-2 rounded-2xl shadow-2xl border border-divider w-full max-w-sm p-6 animate-scale-in text-center"
        (click)="$event.stopPropagation()"
      >
        <div
          class="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4 text-expense"
        >
          <app-icon name="delete_forever" [size]="30" />
        </div>

        <h3 class="text-xl font-bold text-content mb-2">
          {{ deleteMode() === 'goal' ? ts.t()('goals.delete_title') : 'Delete Contribution' }}
        </h3>
        <p class="text-content-muted mb-6">
          {{
            deleteMode() === 'goal'
              ? ts.t()('goals.confirm_delete')
              : 'Are you sure you want to delete this contribution? This will decrease your saved amount.'
          }}
        </p>

        <div class="flex gap-3">
          <button
            (click)="closeDeleteModal()"
            class="flex-1 py-2.5 rounded-xl border border-divider font-medium hover:bg-surface-3 transition-colors"
          >
            {{ ts.t()('action.cancel') }}
          </button>
          <button
            (click)="confirmDelete()"
            class="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-bold shadow-lg shadow-red-500/30 hover:bg-red-600 transition-all"
          >
            {{ ts.t()('trans.delete') }}
          </button>
        </div>
      </div>
    </div>
    }
  `,
})
export class GoalsComponent implements OnInit {
  state = inject(GoalStateService);
  apiService = inject(ApiService);
  ts = inject(TranslationService);
  ns = inject(NotificationService);
  fb = inject(FormBuilder);

  // State Signals
  goals = this.state.goals;
  isLoading = this.state.isLoading;

  showModal = signal(false);
  isSubmitting = signal(false);
  editingId = signal<number | null>(null);

  // 'create' | 'edit' | 'add_funds'
  modalMode = signal<'create' | 'edit' | 'add_funds'>('create');
  selectedGoalName = signal('');

  // History State
  showHistoryModal = signal(false);
  contributions = signal<ContributionResponse[]>([]);
  selectedGoalIdForHistory = signal<number | null>(null);

  // Delete State
  showDeleteModal = signal(false);
  deleteMode = signal<'goal' | 'contribution'>('goal');
  itemToDelete = signal<any>(null); // Can be goal or contribution

  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      name: ['', Validators.required],
      targetAmount: [0, [Validators.required, Validators.min(1)]],
      targetDate: ['', Validators.required],
      contributionAmount: [0], // Only for add_funds mode
      contributionDescription: [''], // New field
    });
  }

  ngOnInit() {
    // Load Goals (Cached)
    this.state.load(0, 50);
  }

  getModalTitle() {
    if (this.modalMode() === 'add_funds') return this.ts.t()('goals.add_funds');
    if (this.modalMode() === 'edit') return this.ts.t()('goals.edit_title');
    return this.ts.t()('goals.new_title');
  }

  // Prevent non-numeric chars (e, +, -, etc)
  validateNumber(event: KeyboardEvent) {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57) && charCode !== 46) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  formatAmount(controlName: string) {
    const control = this.form.get(controlName);
    if (!control || !control.value) return;
    let value = control.value.toString();
    const num = parseFloat(value);

    // Explicitly set null first then the number to force angular to update the view
    // even if the numeric value is technically the same (e.g. "0500" -> 500)
    if (!isNaN(num)) {
      control.setValue(null, { emitEvent: false });
      control.setValue(num, { emitEvent: false });
    }
  }

  calcProgress(goal: SavingGoalsResponse): number {
    if (!goal.targetAmount || goal.targetAmount === 0) return 0;
    return Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
  }

  openModal() {
    this.modalMode.set('create');
    this.editingId.set(null);
    this.form.reset({
      targetAmount: 0,
      contributionAmount: 0,
      contributionDescription: '',
    });
    this.showModal.set(true);
  }

  editGoal(goal: SavingGoalsResponse) {
    this.modalMode.set('edit');
    this.editingId.set(goal.id);
    this.form.patchValue({
      name: goal.name,
      targetAmount: goal.targetAmount,
      targetDate: goal.targetDate,
    });
    this.showModal.set(true);
  }

  addFunds(goal: SavingGoalsResponse) {
    this.modalMode.set('add_funds');
    this.selectedGoalName.set(goal.name);
    this.editingId.set(goal.id);
    this.form.reset({
      contributionAmount: 0,
      contributionDescription: '',
    });
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  // History Methods
  openHistory(goal: SavingGoalsResponse) {
    this.selectedGoalIdForHistory.set(goal.id);
    this.selectedGoalName.set(goal.name);
    this.showHistoryModal.set(true);
    this.loadContributions(goal.id);
  }

  closeHistoryModal() {
    this.showHistoryModal.set(false);
    this.contributions.set([]);
    this.selectedGoalIdForHistory.set(null);
  }

  loadContributions(goalId: number) {
    this.apiService.getGoalContributions(goalId).subscribe({
      next: (res) => {
        // Sort by date desc
        const sorted = (res.content || []).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.contributions.set(sorted);
      },
      error: (err) => console.error('Error loading contributions', err),
    });
  }

  deleteContributionCheck(contribution: ContributionResponse) {
    this.deleteMode.set('contribution');
    this.itemToDelete.set(contribution);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal() {
    this.showDeleteModal.set(false);
    this.itemToDelete.set(null);
  }

  deleteGoal(goal: SavingGoalsResponse) {
    this.deleteMode.set('goal');
    this.itemToDelete.set(goal);
    this.showDeleteModal.set(true);
  }

  confirmDelete() {
    const item = this.itemToDelete();
    if (!item) return;

    // Optimistic Logic: Close modal first
    if (this.deleteMode() === 'goal') {
      this.closeDeleteModal();
    } else {
      this.closeDeleteModal();
    }
    // We can simplify this:
    // this.closeDeleteModal();
    // But we need to keep the logic branching for the API call.

    if (this.deleteMode() === 'goal') {
      const goal = item as SavingGoalsResponse;
      this.state.delete(goal.id).subscribe({
        next: () => {
          this.ns.show('Goal deleted', 'success');
        },
        error: () => {
          this.ns.show('Failed to delete goal', 'error');
        },
      });
    } else {
      // Delete Contribution
      const contribution = item as ContributionResponse;
      const goalId = this.selectedGoalIdForHistory();
      if (!goalId) return;

      this.state.deleteContribution(goalId, contribution.id).subscribe({
        next: () => {
          this.ns.show('Contribution deleted', 'success');
          // Remove from history list
          this.contributions.update((c) => c.filter((x) => x.id !== contribution.id));
        },
        error: () => {
          this.ns.show('Failed to delete contribution', 'error');
        },
      });
    }
  }

  onSubmit() {
    // Determine validation based on mode
    if (this.modalMode() !== 'add_funds') {
      // Validate main fields
      if (
        this.form.get('name')?.invalid ||
        this.form.get('targetAmount')?.invalid ||
        this.form.get('targetDate')?.invalid
      ) {
        return;
      }
    } else {
      // Validate contribution
      if (!this.form.value.contributionAmount || this.form.value.contributionAmount <= 0) {
        this.ns.show('Invalid amount', 'error');
        return;
      }
    }

    this.isSubmitting.set(true);
    const data = this.form.value;
    const id = this.editingId()!;

    // Optimistic Close
    this.closeModal();

    if (this.modalMode() === 'add_funds') {
      this.state
        .addContribution(id, data.contributionAmount, data.contributionDescription)
        .subscribe({
          next: () => {
            this.ns.show('Contribution added!', 'success');
            this.isSubmitting.set(false);
          },
          error: () => this.isSubmitting.set(false),
        });
      return;
    }

    const formattedData = {
      name: data.name,
      targetAmount: data.targetAmount,
      targetDate: new Date(data.targetDate).toISOString().split('T')[0],
    };

    const action$ =
      this.modalMode() === 'edit'
        ? this.state.update(id, formattedData)
        : this.state.add(formattedData);

    action$.subscribe({
      next: () => {
        const msg = this.modalMode() === 'edit' ? 'Goal updated' : 'Goal created';
        this.ns.show(msg, 'success');
        this.isSubmitting.set(false);
      },
      error: () => this.isSubmitting.set(false),
    });
  }
}
