import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BudgetsComponent } from './budgets.component';
import { BudgetStateService } from '../../core/services/budget-state.service';
import { ApiService } from '../../core/services/api.service';
import { TranslationService } from '../../core/services/translation.service';
import { NotificationService } from '../../core/services/notification.service';
import { UiDialogService } from '../../shared/ui';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { Budget, Category } from '../../core/models/api.models';

describe('BudgetsComponent', () => {
  let component: BudgetsComponent;
  let fixture: ComponentFixture<BudgetsComponent>;

  const mockBudgets: Budget[] = [
    {
      id: 1,
      limit: 10000,
      spent: 4500,
      percentage: 45,
      period: 'MONTHLY',
      categoryId: 1,
      startDate: '2026-11-01',
      endDate: '2026-11-30',
      warningThreshold: 75,
      criticalThreshold: 90,
      category: {
        id: 1,
        name: 'Food',
        icons: 'restaurant',
        color: '#10b981',
      },
    },
    {
      id: 2,
      limit: 50000,
      spent: 46000,
      percentage: 92,
      period: 'YEARLY',
      categoryId: 2,
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      warningThreshold: 75,
      criticalThreshold: 90,
      category: {
        id: 2,
        name: 'Home',
        icons: 'home',
        color: '#3b82f6',
      },
    },
  ];

  const mockCategories: Category[] = [
    { id: 1, name: 'Food', icons: 'restaurant', color: '#10b981' },
    { id: 2, name: 'Home', icons: 'home', color: '#3b82f6' },
  ];

  let mockBudgetState: any;
  let mockApiService: any;
  let mockNotificationService: any;
  let mockDialogService: any;

  beforeEach(async () => {
    mockBudgetState = {
      filteredBudgets: signal<Budget[]>(mockBudgets),
      isLoading: signal<boolean>(false),
      currentDate: signal<Date>(new Date(2026, 10, 1)),
      load: vi.fn(),
      hasNotified: vi.fn().mockReturnValue(true),
      markNotified: vi.fn(),
      addBudget: vi.fn().mockReturnValue(of({})),
      updateBudget: vi.fn().mockReturnValue(of({})),
      removeBudget: vi.fn().mockReturnValue(of({})),
    };

    mockApiService = {
      getCategories: vi.fn().mockReturnValue(of(mockCategories)),
    };

    mockNotificationService = {
      show: vi.fn(),
    };

    mockDialogService = {
      confirm: vi.fn().mockResolvedValue(true),
    };

    await TestBed.configureTestingModule({
      imports: [BudgetsComponent],
      providers: [
        { provide: BudgetStateService, useValue: mockBudgetState },
        { provide: ApiService, useValue: mockApiService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: UiDialogService, useValue: mockDialogService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BudgetsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load budgets and categories on init', () => {
    expect(component).toBeTruthy();
    expect(mockBudgetState.load).toHaveBeenCalled();
    expect(mockApiService.getCategories).toHaveBeenCalled();
    expect(component.categories().length).toBe(2);
  });

  it('should correctly calculate progress percentage and status using budget-status', () => {
    const b1 = mockBudgets[0]; // 4500 / 10000 = 45% -> ok
    expect(component.getPercent(b1)).toBe(45);
    expect(component.getStatus(b1)).toBe('ok');

    const b2 = mockBudgets[1]; // 46000 / 50000 = 92% -> critical
    expect(component.getPercent(b2)).toBe(92);
    expect(component.getStatus(b2)).toBe('critical');
  });

  it('should open and close the modal', () => {
    expect(component.showModal()).toBe(false);

    component.openModal();
    expect(component.showModal()).toBe(true);
    expect(component.selectedBudget()).toBeNull();

    component.closeModal();
    expect(component.showModal()).toBe(false);
  });

  it('should populate form when opening modal for edit', () => {
    component.openModal(mockBudgets[0]);
    expect(component.showModal()).toBe(true);
    expect(component.selectedBudget()).toEqual(mockBudgets[0]);
    expect(component.form.value.limit).toBe(10000);
    expect(component.form.value.period).toBe('MONTHLY');
    expect(component.form.value.categoryId).toBe(1);
  });

  it('should submit add budget and show notification', () => {
    component.openModal();
    component.form.setValue({
      limit: 15000,
      period: 'MONTHLY',
      categoryId: 1,
      warningThreshold: 75,
      criticalThreshold: 90,
      isRecurring: false,
      numberOfPeriods: 6,
    });

    component.onSubmit();
    expect(mockBudgetState.addBudget).toHaveBeenCalled();
    expect(mockNotificationService.show).toHaveBeenCalledWith('budgets.created', 'success');
    expect(component.showModal()).toBe(false);
  });

  it('should confirm deletion before calling state.removeBudget', async () => {
    await component.confirmDelete(mockBudgets[0]);
    expect(mockDialogService.confirm).toHaveBeenCalled();
    expect(mockBudgetState.removeBudget).toHaveBeenCalledWith(1);
    expect(mockNotificationService.show).toHaveBeenCalledWith('budgets.deleted', 'success');
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
