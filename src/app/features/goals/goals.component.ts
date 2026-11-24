import {
  Component,
  OnInit,
  signal,
  inject,
  ChangeDetectionStrategy,
  HostListener,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { TranslationService } from '../../core/services/translation.service';
import { NotificationService } from '../../core/services/notification.service';
import { SavingGoalsResponse, ContributionResponse } from '../../core/models/api.models';
import { DatePickerComponent } from '../../shared/components/date-picker/date-picker.component';
import { GoalStateService } from '../../core/services/goal-state.service';
import {
  ButtonComponent,
  AmountComponent,
  IconComponent,
  SkeletonComponent,
  ProgressBarComponent,
  EmptyStateComponent,
  PageHeaderComponent,
  FormFieldComponent,
  CurrencyInputComponent,
  DialogShellComponent,
  UiDialogService,
} from '../../shared/ui';

@Component({
  selector: 'app-goals',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DatePipe,
    DatePickerComponent,
    ButtonComponent,
    AmountComponent,
    IconComponent,
    SkeletonComponent,
    ProgressBarComponent,
    EmptyStateComponent,
    PageHeaderComponent,
    FormFieldComponent,
    CurrencyInputComponent,
    DialogShellComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <!-- Page Header -->
      <ui-page-header
        [title]="ts.t()('goals.title')"
        [subtitle]="ts.t()('goals.subtitle')"
      >
        <div uiHeaderActions class="flex items-center gap-2">
          <button
            uiButton
            variant="primary"
            size="sm"
            type="button"
            (click)="openModal()"
            class="h-9 whitespace-nowrap"
          >
            <ui-icon name="add" size="sm" class="mr-1" />
            <span>{{ ts.t()('goals.add') }}</span>
          </button>
        </div>
      </ui-page-header>

      <!-- Loading State -->
      @if (isLoading() && goals().length === 0) {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          @for (i of [1, 2, 3]; track i) {
            <div
              class="p-5 rounded-2xl bg-surface border border-border flex flex-col justify-between h-56 space-y-4"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <ui-skeleton shape="circle" customClass="w-10 h-10" />
                  <div class="space-y-1.5">
                    <ui-skeleton shape="line" customClass="h-4 w-28" />
                    <ui-skeleton shape="line" customClass="h-3 w-20" />
                  </div>
                </div>
                <ui-skeleton shape="line" customClass="h-6 w-16" />
              </div>
              <div class="space-y-2">
                <div class="flex justify-between">
                  <ui-skeleton shape="line" customClass="h-4 w-12" />
                  <ui-skeleton shape="line" customClass="h-4 w-24" />
                </div>
                <ui-skeleton shape="line" customClass="h-2 w-full" />
              </div>
            </div>
          }
        </div>
      } @else if (goals().length === 0) {
        <!-- Empty State -->
        <ui-empty-state
          icon="flag"
          [title]="ts.t()('goals.empty_title')"
          [description]="ts.t()('goals.empty_desc')"
        >
          <button
            uiButton
            variant="primary"
            uiEmptyAction
            type="button"
            (click)="openModal()"
          >
            <ui-icon name="add" size="sm" class="mr-1" />
            <span>{{ ts.t()('goals.add') }}</span>
          </button>
        </ui-empty-state>
      } @else {
        <!-- Goals Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          @for (goal of goals(); track goal.id) {
            <div
              class="p-5 rounded-2xl bg-surface border border-border flex flex-col justify-between shadow-sm hover:border-accent/40 transition-colors"
            >
              <!-- Card Header -->
              <div>
                <div class="flex items-start justify-between gap-3 mb-3">
                  <div class="flex items-center gap-3 min-w-0">
                    <div
                      class="w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center font-bold shrink-0"
                    >
                      <ui-icon name="flag" size="md" />
                    </div>
                    <div class="min-w-0">
                      <h3 class="font-bold text-ink text-base truncate" [title]="goal.name">
                        {{ goal.name }}
                      </h3>
                      <p class="text-xs text-ink-muted">
                        {{ ts.t()('goals.target') }}: {{ goal.targetDate | date: 'mediumDate' }}
                      </p>
                    </div>
                  </div>

                  <!-- Actions -->
                  <div class="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      uiButton
                      variant="ghost"
                      size="sm"
                      class="h-8 w-8 p-0"
                      (click)="openHistory(goal)"
                      [attr.aria-label]="ts.t()('goals.history_title')"
                      [title]="ts.t()('goals.history_title')"
                    >
                      <ui-icon name="history" size="sm" class="text-ink-muted hover:text-ink" />
                    </button>
                    <button
                      type="button"
                      uiButton
                      variant="ghost"
                      size="sm"
                      class="h-8 w-8 p-0"
                      (click)="editGoal(goal)"
                      [attr.aria-label]="ts.t()('trans.edit')"
                      [title]="ts.t()('trans.edit')"
                    >
                      <ui-icon name="edit" size="sm" class="text-ink-muted hover:text-accent" />
                    </button>
                    <button
                      type="button"
                      uiButton
                      variant="ghost"
                      size="sm"
                      class="h-8 w-8 p-0"
                      (click)="deleteGoal(goal)"
                      [attr.aria-label]="ts.t()('trans.delete')"
                      [title]="ts.t()('trans.delete')"
                    >
                      <ui-icon
                        name="delete"
                        size="sm"
                        class="text-ink-muted hover:text-expense"
                      />
                    </button>
                  </div>
                </div>

                <!-- Amounts & Progress -->
                <div class="mt-4 space-y-2">
                  <div class="flex items-center justify-between text-xs sm:text-sm">
                    <span class="font-mono font-bold tabular-nums text-ink text-base">
                      {{ calcProgress(goal) }}%
                    </span>
                    <span class="text-ink-muted text-xs">
                      <ui-amount [value]="goal.currentAmount" tone="income" size="sm" />
                      <span class="mx-1">/</span>
                      <ui-amount [value]="goal.targetAmount" tone="neutral" size="sm" />
                    </span>
                  </div>

                  <ui-progress-bar
                    [label]="goal.name"
                    [percent]="calcProgress(goal)"
                    status="ok"
                    thickness="regular"
                  />
                </div>
              </div>

              <!-- Card Action Footer -->
              <div class="pt-4 mt-4 border-t border-border">
                <button
                  type="button"
                  uiButton
                  variant="secondary"
                  size="sm"
                  class="w-full justify-center font-semibold"
                  (click)="addFunds(goal)"
                >
                  <ui-icon name="add" size="sm" class="mr-1" />
                  <span>{{ ts.t()('goals.add_funds') }}</span>
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>

    <!-- Create / Edit / Add Funds Modal -->
    @if (showModal()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
        (click)="closeModal()"
      >
        <div class="w-full max-w-md" (click)="$event.stopPropagation()">
          <ui-dialog-shell
            [title]="getModalTitle()"
            [closeLabel]="ts.t()('trans.cancel')"
            (closed)="closeModal()"
          >
            <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
              <!-- Add Funds Mode -->
              @if (modalMode() === 'add_funds') {
                <div class="p-3.5 rounded-xl bg-accent/10 border border-accent/20 flex items-center gap-3">
                  <ui-icon name="savings" size="md" class="text-accent" />
                  <div>
                    <p class="text-[10px] uppercase font-bold tracking-wider text-ink-muted">
                      {{ ts.t()('goals.target') }}
                    </p>
                    <p class="font-bold text-ink text-sm">{{ selectedGoalName() }}</p>
                  </div>
                </div>

                <ui-form-field
                  [label]="ts.t()('trans.amount')"
                  fieldId="contribution-amount"
                >
                  <ui-currency-input
                    inputId="contribution-amount"
                    formControlName="contributionAmount"
                  />
                </ui-form-field>

                <ui-form-field
                  [label]="ts.t()('trans.desc')"
                  fieldId="contribution-desc"
                >
                  <input
                    id="contribution-desc"
                    type="text"
                    formControlName="contributionDescription"
                    placeholder="e.g. Weekly savings, bonus, etc."
                    class="w-full h-10 px-3 bg-surface border border-border text-ink text-sm rounded-md shadow-sm placeholder:text-ink-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:border-accent"
                  />
                </ui-form-field>
              } @else {
                <!-- Create / Edit Mode -->
                <ui-form-field
                  [label]="ts.t()('goals.field_name')"
                  fieldId="goal-name"
                >
                  <input
                    id="goal-name"
                    type="text"
                    formControlName="name"
                    placeholder="e.g. Emergency Fund, Trip, Laptop"
                    class="w-full h-10 px-3 bg-surface border border-border text-ink text-sm rounded-md shadow-sm placeholder:text-ink-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:border-accent"
                  />
                </ui-form-field>

                <ui-form-field
                  [label]="ts.t()('goals.field_target')"
                  fieldId="goal-target-amount"
                >
                  <ui-currency-input
                    inputId="goal-target-amount"
                    formControlName="targetAmount"
                  />
                </ui-form-field>

                <ui-form-field
                  [label]="ts.t()('goals.field_date')"
                  fieldId="goal-target-date"
                >
                  <app-date-picker formControlName="targetDate" />
                </ui-form-field>
              }

              <!-- Dialog Footer Buttons -->
              <div uiDialogFooter class="flex items-center justify-end gap-2.5">
                <button type="button" uiButton variant="secondary" (click)="closeModal()">
                  {{ ts.t()('trans.cancel') }}
                </button>
                <button
                  type="submit"
                  uiButton
                  variant="primary"
                  [disabled]="isSubmitting() || isSubmitDisabled()"
                  [loading]="isSubmitting()"
                >
                  {{ ts.t()('trans.save') }}
                </button>
              </div>
            </form>
          </ui-dialog-shell>
        </div>
      </div>
    }

    <!-- History Modal -->
    @if (showHistoryModal()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
        (click)="closeHistoryModal()"
      >
        <div class="w-full max-w-lg md:max-w-xl" (click)="$event.stopPropagation()">
          <ui-dialog-shell
            [title]="ts.t()('goals.history_title')"
            [closeLabel]="ts.t()('trans.cancel')"
            (closed)="closeHistoryModal()"
          >
            <div class="space-y-4">
              <p class="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                {{ selectedGoalName() }}
              </p>

              @if (contributions().length === 0) {
                <div class="text-center py-8 text-ink-muted">
                  <ui-icon name="history" size="lg" class="mx-auto mb-2 opacity-50" />
                  <p class="text-sm">{{ ts.t()('goals.no_contributions') }}</p>
                </div>
              } @else {
                <div class="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                  @for (item of contributions(); track item.id) {
                    <div
                      class="flex items-center justify-between p-3.5 rounded-xl bg-surface-raised border border-border transition-colors hover:border-accent/30"
                    >
                      <div class="flex items-center gap-3 min-w-0">
                        <div
                          class="w-9 h-9 rounded-full bg-income/10 text-income flex items-center justify-center shrink-0"
                        >
                          <ui-icon name="arrow_upward" size="sm" />
                        </div>
                        <div class="min-w-0">
                          <p class="font-bold text-ink text-sm">
                            <ui-amount [value]="item.amount" tone="income" size="sm" />
                          </p>
                          <p class="text-xs text-ink-muted">
                            {{ item.createdAt | date: 'mediumDate' }}
                          </p>
                          @if (item.description) {
                            <p class="text-xs text-ink-muted mt-0.5 truncate">
                              {{ item.description }}
                            </p>
                          }
                        </div>
                      </div>

                      <button
                        type="button"
                        uiButton
                        variant="ghost"
                        size="sm"
                        class="h-8 w-8 p-0 shrink-0"
                        (click)="deleteContributionCheck(item)"
                        [attr.aria-label]="ts.t()('goals.delete_contribution_title')"
                        [title]="ts.t()('goals.delete_contribution_title')"
                      >
                        <ui-icon name="delete" size="sm" class="text-ink-muted hover:text-expense" />
                      </button>
                    </div>
                  }
                </div>
              }
            </div>
          </ui-dialog-shell>
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
  dialogService = inject(UiDialogService);
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

  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      name: ['', Validators.required],
      targetAmount: [0, [Validators.required, Validators.min(1)]],
      targetDate: ['', Validators.required],
      contributionAmount: [0],
      contributionDescription: [''],
    });
  }

  ngOnInit() {
    this.state.load(0, 50);
  }

  getModalTitle(): string {
    if (this.modalMode() === 'add_funds') return this.ts.t()('goals.add_funds');
    if (this.modalMode() === 'edit') return this.ts.t()('goals.edit_title');
    return this.ts.t()('goals.new_title');
  }

  calcProgress(goal: SavingGoalsResponse): number {
    if (!goal.targetAmount || goal.targetAmount === 0) return 0;
    return Math.round(Math.min(100, (goal.currentAmount / goal.targetAmount) * 100));
  }

  isSubmitDisabled(): boolean {
    if (this.modalMode() === 'add_funds') {
      const amt = this.form.get('contributionAmount')?.value;
      return !amt || amt <= 0;
    }
    return this.form.invalid;
  }

  openModal() {
    this.modalMode.set('create');
    this.editingId.set(null);
    this.form.reset({
      name: '',
      targetAmount: 0,
      targetDate: new Date().toISOString().split('T')[0],
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
        const sorted = (res.content || []).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.contributions.set(sorted);
      },
      error: (err) => console.error('Error loading contributions', err),
    });
  }

  async deleteContributionCheck(contribution: ContributionResponse) {
    const confirmed = await this.dialogService.confirm({
      title: this.ts.t()('goals.delete_contribution_title'),
      message: this.ts.t()('goals.delete_contribution_msg'),
      confirmLabel: this.ts.t()('trans.delete'),
      cancelLabel: this.ts.t()('trans.cancel'),
      tone: 'danger',
    });

    if (confirmed) {
      const goalId = this.selectedGoalIdForHistory();
      if (!goalId) return;

      this.state.deleteContribution(goalId, contribution.id).subscribe({
        next: () => {
          this.ns.show('goals.contribution_deleted', 'success');
          this.contributions.update((c) => c.filter((x) => x.id !== contribution.id));
        },
        error: () => {
          this.ns.show('notif.operation_failed', 'error');
        },
      });
    }
  }

  async deleteGoal(goal: SavingGoalsResponse) {
    const confirmed = await this.dialogService.confirm({
      title: this.ts.t()('goals.delete_title'),
      message: this.ts.t()('goals.confirm_delete'),
      confirmLabel: this.ts.t()('trans.delete'),
      cancelLabel: this.ts.t()('trans.cancel'),
      tone: 'danger',
    });

    if (confirmed) {
      this.state.delete(goal.id).subscribe({
        next: () => {
          this.ns.show('goals.goal_deleted', 'success');
        },
        error: () => {
          this.ns.show('notif.operation_failed', 'error');
        },
      });
    }
  }

  onSubmit() {
    if (this.isSubmitDisabled()) return;

    this.isSubmitting.set(true);
    const data = this.form.value;
    const id = this.editingId()!;

    // Optimistic Close
    this.closeModal();

    if (this.modalMode() === 'add_funds') {
      this.state
        .addContribution(id, Number(data.contributionAmount), data.contributionDescription)
        .subscribe({
          next: () => {
            this.ns.show('goals.contribution_added', 'success');
            this.isSubmitting.set(false);
          },
          error: () => this.isSubmitting.set(false),
        });
      return;
    }

    const formattedData = {
      name: data.name,
      targetAmount: Number(data.targetAmount),
      targetDate: new Date(data.targetDate).toISOString().split('T')[0],
    };

    const action$ =
      this.modalMode() === 'edit'
        ? this.state.update(id, formattedData)
        : this.state.add(formattedData);

    action$.subscribe({
      next: () => {
        const msg = this.modalMode() === 'edit' ? 'goals.goal_updated' : 'goals.goal_created';
        this.ns.show(msg, 'success');
        this.isSubmitting.set(false);
      },
      error: () => this.isSubmitting.set(false),
    });
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      if (this.showHistoryModal()) {
        this.closeHistoryModal();
        return;
      }
      if (this.showModal()) {
        this.closeModal();
      }
    } else if (event.key === 'Enter') {
      if (this.showModal() && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        this.onSubmit();
      }
    } else if ((event.altKey && event.key === 'n') || (event.altKey && event.key === 'N')) {
      if (!this.showModal() && !this.showHistoryModal()) {
        event.preventDefault();
        this.openModal();
      }
    }
  }
}
