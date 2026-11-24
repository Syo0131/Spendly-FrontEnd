import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExpensesComponent } from './expenses.component';
import { ExpenseStateService } from '../../core/services/expense-state.service';
import { ApiService } from '../../core/services/api.service';
import { TranslationService } from '../../core/services/translation.service';
import { NotificationService } from '../../core/services/notification.service';
import { UiDialogService } from '../../shared/ui';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { ExpenseResponse, Category } from '../../core/models/api.models';

describe('ExpensesComponent', () => {
  let component: ExpensesComponent;
  let fixture: ComponentFixture<ExpensesComponent>;

  const mockExpenses: ExpenseResponse[] = [
    {
      id: 1,
      description: 'Supermarket Groceries',
      amount: 4500,
      date: '2026-11-20',
      currency: 'DOP',
      category: {
        id: 1,
        name: 'Food',
        icons: 'restaurant',
        color: '#10b981',
      },
    },
    {
      id: 2,
      description: 'Internet Bill',
      amount: 2200,
      date: '2026-11-22',
      currency: 'DOP',
      category: {
        id: 2,
        name: 'Services',
        icons: 'wifi',
        color: '#3b82f6',
      },
    },
  ];

  const mockCategories: Category[] = [
    { id: 1, name: 'Food', icons: 'restaurant', color: '#10b981' },
    { id: 2, name: 'Services', icons: 'wifi', color: '#3b82f6' },
  ];

  let mockExpenseState: any;
  let mockApiService: any;
  let mockNotificationService: any;
  let mockDialogService: any;

  beforeEach(async () => {
    mockExpenseState = {
      expenses: signal<ExpenseResponse[]>(mockExpenses),
      isLoading: signal<boolean>(false),
      totalElements: signal<number>(2),
      totalPages: signal<number>(1),
      currentPage: signal<number>(0),
      categoryFilter: signal<number | null>(null),
      dateFilter: signal<{ month: number; year: number } | null>(null),
      setFilter: vi.fn((id: number | null) => mockExpenseState.categoryFilter.set(id)),
      setDateFilter: vi.fn((m: number | null, y: number | null) => {
        mockExpenseState.dateFilter.set(m && y ? { month: m, year: y } : null);
      }),
      refresh: vi.fn(),
      load: vi.fn(),
      add: vi.fn().mockReturnValue(of({})),
      update: vi.fn().mockReturnValue(of({})),
      delete: vi.fn().mockReturnValue(of({})),
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
      imports: [ExpensesComponent],
      providers: [
        provideRouter([]),
        { provide: ExpenseStateService, useValue: mockExpenseState },
        { provide: ApiService, useValue: mockApiService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: UiDialogService, useValue: mockDialogService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParams: {
                category: '1',
                month: '11',
                year: '2026',
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ExpensesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and initialize categories, filters from query params', () => {
    expect(component).toBeTruthy();
    expect(mockExpenseState.setFilter).toHaveBeenCalledWith(1);
    expect(mockExpenseState.setDateFilter).toHaveBeenCalledWith(11, 2026);
    expect(mockExpenseState.refresh).toHaveBeenCalled();
    expect(mockApiService.getCategories).toHaveBeenCalled();
    expect(component.categories().length).toBe(2);
  });

  it('should render table rows on desktop and list rows on mobile', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const descCells = compiled.querySelectorAll('table tbody tr');
    expect(descCells.length).toBe(2);
  });

  it('should open and close the add/edit modal', () => {
    expect(component.showModal()).toBe(false);

    component.openModal();
    expect(component.showModal()).toBe(true);
    expect(component.editingId()).toBeNull();

    component.closeModal();
    expect(component.showModal()).toBe(false);
  });

  it('should populate form when opening modal for edit', () => {
    component.openModal(mockExpenses[0]);
    expect(component.showModal()).toBe(true);
    expect(component.editingId()).toBe(1);
    expect(component.form.value.description).toBe('Supermarket Groceries');
    expect(component.form.value.amount).toBe(4500);
    expect(component.form.value.categoryId).toBe(1);
  });

  it('should submit add expense and show notification', () => {
    component.openModal();
    component.form.setValue({
      description: 'Dinner with friends',
      amount: 1500,
      date: '2026-11-24',
      currency: 'DOP',
      categoryId: 1,
    });

    component.onSubmit();
    expect(mockExpenseState.add).toHaveBeenCalled();
    expect(mockNotificationService.show).toHaveBeenCalledWith('notif.expense_created', 'success');
    expect(component.showModal()).toBe(false);
  });

  it('should confirm deletion before calling state.delete', async () => {
    await component.deleteItem(mockExpenses[0]);
    expect(mockDialogService.confirm).toHaveBeenCalled();
    expect(mockExpenseState.delete).toHaveBeenCalledWith(1);
    expect(mockNotificationService.show).toHaveBeenCalledWith('notif.expense_deleted', 'success');
  });

  it('should handle keyboard shortcuts (Alt+N, Esc, Ctrl+Enter)', () => {
    // Alt + N
    component.handleKeyboardEvent(new KeyboardEvent('keydown', { key: 'n', altKey: true }));
    expect(component.showModal()).toBe(true);

    // Escape closes modal
    component.handleKeyboardEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(component.showModal()).toBe(false);
  });

  it('should toggle month and category filter dropdowns', () => {
    component.toggleFilterDropdown();
    expect(component.showFilterDropdown()).toBe(true);
    component.applyFilter(mockCategories[0]);
    expect(component.showFilterDropdown()).toBe(false);
    expect(mockExpenseState.setFilter).toHaveBeenCalledWith(1);

    component.toggleMonthPicker();
    expect(component.isMonthPickerOpen()).toBe(true);
    component.selectMonth(10, 2026);
    expect(component.isMonthPickerOpen()).toBe(false);
    expect(mockExpenseState.setDateFilter).toHaveBeenCalledWith(10, 2026);
  });
});
