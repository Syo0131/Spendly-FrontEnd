import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { TranslationService } from '../../core/services/translation.service';
import { NotificationService } from '../../core/services/notification.service';
import { SavingGoalsResponse, ContributionResponse } from '../../core/models/api.models';
import { DatePickerComponent } from '../../shared/components/date-picker/date-picker.component';

@Component({
  selector: 'app-goals',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePickerComponent],
  template: `
    <div class="p-6 pb-24 md:pb-6 animate-fade-in-up">
      <!-- Header -->
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
            {{ ts.t()('goals.title') }}
          </h1>
          <p class="text-gray-500 dark:text-gray-400">
            {{ ts.t()('goals.subtitle') }}
          </p>
        </div>
        <button
          (click)="openModal()"
          class="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl font-medium shadow-lg shadow-primary/30 transition-all hover:scale-105 flex items-center gap-2"
        >
          <span class="material-icons-outlined">add</span>
          <span class="hidden md:inline">{{ ts.t()('goals.add') }}</span>
        </button>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading()" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          *ngFor="let i of [1, 2, 3]"
          class="h-48 rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse"
        ></div>
      </div>

      <!-- Empty State -->
      <div
        *ngIf="!isLoading() && goals().length === 0"
        class="glass-card p-12 text-center text-gray-500 dark:text-gray-400"
      >
        <span class="material-icons-outlined text-6xl mb-4 text-primary opacity-50">flag</span>
        <h3 class="text-xl font-bold mb-2">{{ ts.t()('goals.empty_title') }}</h3>
        <p>{{ ts.t()('goals.empty_desc') }}</p>
      </div>

      <!-- Goals Grid -->
      <div
        *ngIf="!isLoading() && goals().length > 0"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <div
          *ngFor="let goal of goals()"
          class="glass-card p-6 relative group border border-gray-200 dark:border-white/10"
        >
          <!-- Menu Button -->
          <button
            (click)="editGoal(goal)"
            class="absolute top-4 right-4 p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
          >
            <span class="material-icons-outlined">edit</span>
          </button>

          <!-- History Button -->
          <button
            (click)="openHistory(goal)"
            class="absolute top-4 right-14 p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
            title="History"
          >
            <span class="material-icons-outlined">history</span>
          </button>

          <div class="mb-4">
            <div
              class="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-4 text-orange-500"
            >
              <span class="material-icons-outlined text-2xl">savings</span>
            </div>
            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-1">{{ goal.name }}</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ ts.t()('goals.target') }}: {{ goal.targetDate | date }}
            </p>
          </div>

          <!-- Progress -->
          <div class="mb-2 flex justify-between items-end">
            <span class="text-xs font-medium text-gray-500 dark:text-gray-400">
              {{ calcProgress(goal) | number : '1.0-0' }}%
            </span>
            <span class="text-sm font-bold text-gray-900 dark:text-gray-100">
              DOP {{ goal.currentAmount | number : '1.2-2' }} /
              {{ goal.targetAmount | number : '1.2-2' }}
            </span>
          </div>

          <div class="w-full bg-gray-200 dark:bg-white/10 rounded-full h-3 mb-6 overflow-hidden">
            <div
              class="bg-primary h-3 rounded-full transition-all duration-1000 ease-out"
              [style.width.%]="calcProgress(goal)"
            ></div>
          </div>

          <!-- Actions Footer -->
          <div
            class="flex items-center gap-3 mt-auto pt-4 border-t border-gray-100 dark:border-white/5"
          >
            <button
              (click)="addFunds(goal)"
              class="flex-1 py-2 text-sm font-medium text-primary bg-primary/10 dark:bg-primary/20 rounded-lg hover:bg-primary/20 dark:hover:bg-primary/30 transition-colors"
            >
              + {{ ts.t()('goals.add_funds') }}
            </button>
            <button
              (click)="deleteGoal(goal)"
              class="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <span class="material-icons-outlined text-lg">delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- History Modal -->
    <div
      *ngIf="showHistoryModal()"
      class="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      (click)="closeHistoryModal()"
    >
      <div
        class="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 w-full max-w-lg md:max-w-2xl max-h-[80vh] flex flex-col animate-scale-in"
        (click)="$event.stopPropagation()"
      >
        <div
          class="p-6 border-b border-gray-200 dark:border-white/10 flex justify-between items-center"
        >
          <div>
            <h2 class="text-xl font-bold text-gray-900 dark:text-white">Contribution History</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ selectedGoalName() }}</p>
          </div>
          <button
            (click)="closeHistoryModal()"
            class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <span class="material-icons-outlined">close</span>
          </button>
        </div>

        <div class="p-6 overflow-y-auto custom-scrollbar">
          <div
            *ngIf="contributions().length === 0"
            class="text-center py-8 text-gray-500 dark:text-gray-400"
          >
            <span class="material-icons-outlined text-4xl mb-2 opacity-50">history</span>
            <p>No contributions yet.</p>
          </div>

          <div class="space-y-4">
            <div
              *ngFor="let item of contributions()"
              class="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 hover:border-primary/30 transition-colors group"
            >
              <div class="flex items-center gap-4">
                <div
                  class="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400"
                >
                  <span class="material-icons-outlined text-lg">arrow_upward</span>
                </div>
                <div>
                  <p class="font-bold text-gray-900 dark:text-white">
                    + {{ item.amount | number : '1.2-2' }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ item.createdAt | date : 'mediumDate' }} •
                    {{ item.createdAt | date : 'shortTime' }}
                  </p>
                  <p *ngIf="item.description" class="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {{ item.description }}
                  </p>
                </div>
              </div>

              <button
                (click)="deleteContributionCheck(item)"
                class="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                title="Delete Contribution"
              >
                <span class="material-icons-outlined">delete_outline</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div
      *ngIf="showModal()"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      (click)="closeModal()"
    >
      <div
        class="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 w-full max-w-md animate-scale-in"
        (click)="$event.stopPropagation()"
      >
        <div
          class="p-6 border-b border-gray-200 dark:border-white/10 flex justify-between items-center"
        >
          <h2 class="text-xl font-bold text-gray-900 dark:text-white">
            {{ getModalTitle() }}
          </h2>
          <button
            (click)="closeModal()"
            class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <span class="material-icons-outlined">close</span>
          </button>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="p-6 space-y-4">
          <!-- Add Funds Mode -->
          <ng-container *ngIf="modalMode() === 'add_funds'">
            <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl flex items-center gap-3 mb-2">
              <span class="material-icons-outlined text-blue-500 text-2xl">savings</span>
              <div>
                <p
                  class="text-xs text-uppercase text-gray-500 dark:text-gray-400 font-bold tracking-wider"
                >
                  META
                </p>
                <p class="font-bold text-gray-900 dark:text-white">{{ selectedGoalName() }}</p>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {{ ts.t()('trans.amount') }} (RD$)
              </label>
              <input
                type="number"
                formControlName="contributionAmount"
                placeholder="0.00"
                (keypress)="validateNumber($event)"
                (blur)="formatAmount('contributionAmount')"
                class="no-spinner w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-2xl font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 text-center"
              />
            </div>

            <div class="mt-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {{ ts.t()('forms.description_optional') }}
              </label>
              <input
                type="text"
                formControlName="contributionDescription"
                placeholder="e.g. Weekly Savings"
                class="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </ng-container>

          <!-- Create/Edit Mode -->
          <ng-container *ngIf="modalMode() !== 'add_funds'">
            <!-- Name -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {{ ts.t()('goals.field_name') }}
              </label>
              <input
                type="text"
                formControlName="name"
                class="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <!-- Target Amount -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {{ ts.t()('goals.field_target') }}
              </label>
              <input
                type="number"
                formControlName="targetAmount"
                (keypress)="validateNumber($event)"
                (blur)="formatAmount('targetAmount')"
                class="no-spinner w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <!-- Target Date -->
            <div class="z-20 relative">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {{ ts.t()('goals.field_date') }}
              </label>
              <app-date-picker formControlName="targetDate"></app-date-picker>
            </div>
          </ng-container>

          <div class="flex gap-3 pt-4 relative z-0">
            <button
              type="button"
              (click)="closeModal()"
              class="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
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
              class="flex-1 py-3 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/25 hover:bg-primary-dark transition-all disabled:opacity-50"
            >
              {{ isSubmitting() ? '...' : ts.t()('action.save') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal (Common) -->
    <div
      *ngIf="showDeleteModal()"
      class="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      (click)="closeDeleteModal()"
    >
      <div
        class="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 w-full max-w-sm p-6 animate-scale-in text-center"
        (click)="$event.stopPropagation()"
      >
        <div
          class="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4 text-red-500"
        >
          <span class="material-icons-outlined text-3xl">delete_forever</span>
        </div>

        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {{ deleteMode() === 'goal' ? ts.t()('goals.delete_title') : 'Delete Contribution' }}
        </h3>
        <p class="text-gray-500 dark:text-gray-400 mb-6">
          {{
            deleteMode() === 'goal'
              ? ts.t()('goals.confirm_delete')
              : 'Are you sure you want to delete this contribution? This will decrease your saved amount.'
          }}
        </p>

        <div class="flex gap-3">
          <button
            (click)="closeDeleteModal()"
            class="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
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
  `,
})
export class GoalsComponent implements OnInit {
  goals = signal<SavingGoalsResponse[]>([]);
  isLoading = signal(true);
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

  apiService = inject(ApiService);
  ts = inject(TranslationService);
  ns = inject(NotificationService);
  fb = inject(FormBuilder);

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
    this.loadData();
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

  loadData(silent = false) {
    if (!silent) this.isLoading.set(true);
    this.apiService.getSavingGoals(0, 50).subscribe({
      next: (res) => {
        this.goals.set(res.content || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading goals', err);
        this.isLoading.set(false);
      },
    });
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

  // Existing methods...

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

    if (this.deleteMode() === 'goal') {
      const goal = item as SavingGoalsResponse;
      this.apiService.deleteSavingGoal(goal.id).subscribe({
        next: () => {
          this.ns.show('Goal deleted', 'success');
          this.goals.update((current) => current.filter((g) => g.id !== goal.id));
          this.closeDeleteModal();
        },
        error: () => {
          this.ns.show('Failed to delete goal', 'error');
          this.closeDeleteModal();
        },
      });
    } else {
      // Delete Contribution
      const contribution = item as ContributionResponse;
      const goalId = this.selectedGoalIdForHistory();
      if (!goalId) return;

      this.apiService.deleteContribution(goalId, contribution.id).subscribe({
        next: () => {
          this.ns.show('Contribution deleted', 'success');
          // Remove from history list
          this.contributions.update((c) => c.filter((x) => x.id !== contribution.id));
          // Reload goals silently to update totals
          this.loadData(true);
          this.closeDeleteModal();
        },
        error: () => {
          this.ns.show('Failed to delete contribution', 'error');
          this.closeDeleteModal();
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

    if (this.modalMode() === 'add_funds') {
      // Add Contribution with correct signature
      // Assuming apiService.addContribution needs to be updated to accept description if backend supports it
      // But based on available information, we pass amount directly.
      // Wait, user asked to add description. I need to update api service call signature.
      // Let's check api.service.ts source in memory or assume I need to update it.
      // The openapi spec showed "AddContributionDto" has "description".
      // But "addContribution" method in api.service.ts currently takes (id, amount).
      // I should update the method call here passing the description as a second argument if I updated the service?
      // Wait, I updated ApiService earlier? No, I only updated return types.
      // I need to update ApiService to accept description.
      // Use the 'description' from the form.

      // Since I can't edit ApiService in this `replace_file_content` call (it's for goals.component.ts),
      // I will assume ApiService will be updated to take an object or additional arg.
      // Actually, looking at `api.service.ts` from previous turns, `addContribution` takes `(id, amount)`.
      // I need to change `api.service.ts` to `addContribution(id, amount, description?)`.

      // Implementation plan says "Add description field".
      // Let's pass it here assuming the service will be updated next.
      this.apiService
        .addContribution(id, data.contributionAmount, data.contributionDescription)
        .subscribe({
          next: () => {
            this.ns.show('Contribution added!', 'success');
            this.closeModal();
            this.loadData(true); // Silent reload
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

    if (this.modalMode() === 'edit') {
      this.apiService.updateSavingGoal(id, formattedData).subscribe({
        next: () => {
          this.ns.show('Goal updated', 'success');
          this.closeModal();
          this.loadData(true); // Silent reload
          this.isSubmitting.set(false);
        },
        error: () => this.isSubmitting.set(false),
      });
    } else {
      this.apiService.createSavingGoal(formattedData).subscribe({
        next: () => {
          this.ns.show('Goal created', 'success');
          this.closeModal();
          this.loadData(true); // Silent reload
          this.isSubmitting.set(false);
        },
        error: () => this.isSubmitting.set(false),
      });
    }
  }
}
