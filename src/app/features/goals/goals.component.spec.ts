import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GoalsComponent } from './goals.component';
import { GoalStateService } from '../../core/services/goal-state.service';
import { ApiService } from '../../core/services/api.service';
import { TranslationService } from '../../core/services/translation.service';
import { NotificationService } from '../../core/services/notification.service';
import { UiDialogService } from '../../shared/ui';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { SavingGoalsResponse, ContributionResponse } from '../../core/models/api.models';

describe('GoalsComponent', () => {
  let component: GoalsComponent;
  let fixture: ComponentFixture<GoalsComponent>;

  const mockGoals: SavingGoalsResponse[] = [
    {
      id: 1,
      name: 'Emergency Fund',
      targetAmount: 100000,
      currentAmount: 40000,
      targetDate: '2027-12-31',
      enable: true,
      achieved: false,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-11-20T00:00:00Z',
    },
    {
      id: 2,
      name: 'Japan Vacation',
      targetAmount: 200000,
      currentAmount: 200000,
      targetDate: '2028-06-30',
      enable: true,
      achieved: true,
      createdAt: '2026-02-01T00:00:00Z',
      updatedAt: '2026-11-20T00:00:00Z',
    },
  ];

  const mockContributions: ContributionResponse[] = [
    {
      id: 10,
      amount: 15000,
      description: 'Monthly savings',
      createdAt: '2026-11-15T10:00:00Z',
    },
  ];

  let mockGoalState: any;
  let mockApiService: any;
  let mockNotificationService: any;
  let mockDialogService: any;

  beforeEach(async () => {
    mockGoalState = {
      goals: signal<SavingGoalsResponse[]>(mockGoals),
      isLoading: signal<boolean>(false),
      load: vi.fn(),
      add: vi.fn().mockReturnValue(of({})),
      update: vi.fn().mockReturnValue(of({})),
      delete: vi.fn().mockReturnValue(of({})),
      addContribution: vi.fn().mockReturnValue(of({})),
      deleteContribution: vi.fn().mockReturnValue(of({})),
    };

    mockApiService = {
      getGoalContributions: vi.fn().mockReturnValue(of({ content: mockContributions })),
    };

    mockNotificationService = {
      show: vi.fn(),
    };

    mockDialogService = {
      confirm: vi.fn().mockResolvedValue(true),
    };

    await TestBed.configureTestingModule({
      imports: [GoalsComponent],
      providers: [
        { provide: GoalStateService, useValue: mockGoalState },
        { provide: ApiService, useValue: mockApiService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: UiDialogService, useValue: mockDialogService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GoalsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load goals on init', () => {
    expect(component).toBeTruthy();
    expect(mockGoalState.load).toHaveBeenCalledWith(0, 50);
    expect(component.goals().length).toBe(2);
  });

  it('should calculate progress percentage accurately', () => {
    expect(component.calcProgress(mockGoals[0])).toBe(40);
    expect(component.calcProgress(mockGoals[1])).toBe(100);
  });

  it('should open modal for create, edit and add funds', () => {
    // Create mode
    component.openModal();
    expect(component.showModal()).toBe(true);
    expect(component.modalMode()).toBe('create');
    expect(component.editingId()).toBeNull();

    // Edit mode
    component.editGoal(mockGoals[0]);
    expect(component.showModal()).toBe(true);
    expect(component.modalMode()).toBe('edit');
    expect(component.editingId()).toBe(1);
    expect(component.form.value.name).toBe('Emergency Fund');

    // Add funds mode
    component.addFunds(mockGoals[0]);
    expect(component.showModal()).toBe(true);
    expect(component.modalMode()).toBe('add_funds');
    expect(component.selectedGoalName()).toBe('Emergency Fund');
  });

  it('should submit add funds and show toast', () => {
    component.addFunds(mockGoals[0]);
    component.form.patchValue({
      contributionAmount: 5000,
      contributionDescription: 'Bonus bonus',
    });

    component.onSubmit();
    expect(mockGoalState.addContribution).toHaveBeenCalledWith(1, 5000, 'Bonus bonus');
    expect(mockNotificationService.show).toHaveBeenCalledWith('goals.contribution_added', 'success');
    expect(component.showModal()).toBe(false);
  });

  it('should open history modal and load contributions', () => {
    component.openHistory(mockGoals[0]);
    expect(component.showHistoryModal()).toBe(true);
    expect(mockApiService.getGoalContributions).toHaveBeenCalledWith(1);
    expect(component.contributions().length).toBe(1);
  });

  it('should confirm deletion of goal before calling state.delete', async () => {
    await component.deleteGoal(mockGoals[0]);
    expect(mockDialogService.confirm).toHaveBeenCalled();
    expect(mockGoalState.delete).toHaveBeenCalledWith(1);
    expect(mockNotificationService.show).toHaveBeenCalledWith('goals.goal_deleted', 'success');
  });

  it('should confirm deletion of contribution before calling state.deleteContribution', async () => {
    component.selectedGoalIdForHistory.set(1);
    await component.deleteContributionCheck(mockContributions[0]);
    expect(mockDialogService.confirm).toHaveBeenCalled();
    expect(mockGoalState.deleteContribution).toHaveBeenCalledWith(1, 10);
    expect(mockNotificationService.show).toHaveBeenCalledWith('goals.contribution_deleted', 'success');
  });

  it('should handle keyboard shortcuts (Alt+N, Esc, Ctrl+Enter)', () => {
    // Alt + N
    component.handleKeyboardEvent(new KeyboardEvent('keydown', { key: 'n', altKey: true }));
    expect(component.showModal()).toBe(true);

    // Escape closes modal
    component.handleKeyboardEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(component.showModal()).toBe(false);
  });
});
