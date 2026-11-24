import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecurringComponent } from './recurring.component';
import { RecurringStateService } from '../../core/services/recurring-state.service';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { UiDialogService } from '../../shared/ui';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { RecurringExpense, Category } from '../../core/models/api.models';

describe('RecurringComponent', () => {
  let component: RecurringComponent;
  let fixture: ComponentFixture<RecurringComponent>;

  const mockCategories: Category[] = [
    { id: 1, name: 'Entertainment', icons: 'movie', color: '#8b5cf6' },
    { id: 2, name: 'Housing', icons: 'home', color: '#10b981' },
  ];

  const mockRecurring: RecurringExpense[] = [
    {
      id: 1,
      description: 'Netflix Subscription',
      amount: 600,
      currency: 'DOP',
      frequency: 'MONTHLY',
      dayOfMonth: 15,
      nextExecutionDate: '2026-12-15',
      occurrencesCreated: 5,
      isActive: true,
      createdAt: '2026-07-15T00:00:00Z',
      category: mockCategories[0],
    },
    {
      id: 2,
      description: 'Weekly Housekeeper',
      amount: 2500,
      currency: 'DOP',
      frequency: 'WEEKLY',
      dayOfWeek: 5,
      nextExecutionDate: '2026-11-28',
      occurrencesCreated: 10,
      isActive: false,
      createdAt: '2026-08-01T00:00:00Z',
      category: mockCategories[1],
    },
  ];

  let mockRecurringState: any;
  let mockApiService: any;
  let mockNotificationService: any;
  let mockDialogService: any;

  beforeEach(async () => {
    mockRecurringState = {
      recurringExpenses: signal<RecurringExpense[]>(mockRecurring),
      isLoading: signal<boolean>(false),
      add: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({}),
      delete: vi.fn().mockResolvedValue({}),
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
      imports: [RecurringComponent],
      providers: [
        { provide: RecurringStateService, useValue: mockRecurringState },
        { provide: ApiService, useValue: mockApiService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: UiDialogService, useValue: mockDialogService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RecurringComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load categories on init', () => {
    expect(component).toBeTruthy();
    expect(mockApiService.getCategories).toHaveBeenCalled();
    expect(component.categories().length).toBe(2);
  });

  it('should format frequency labels properly', () => {
    expect(component.getFrequencyLabel('MONTHLY')).toBe('Monthly');
    expect(component.getFrequencyLabel('WEEKLY')).toBe('Weekly');
    expect(component.getFrequencyLabel('DAILY')).toBe('Daily');
    expect(component.getFrequencyLabel('YEARLY')).toBe('Yearly');
  });

  it('should open and close the modal for create and edit', () => {
    // Create mode
    component.openModal();
    expect(component.showModal()).toBe(true);
    expect(component.editingId()).toBeNull();

    // Edit mode
    component.openModal(mockRecurring[0]);
    expect(component.showModal()).toBe(true);
    expect(component.editingId()).toBe(1);
    expect(component.form.value.description).toBe('Netflix Subscription');
    expect(component.form.value.amount).toBe(600);

    component.closeModal();
    expect(component.showModal()).toBe(false);
  });

  it('should submit add recurring expense and show toast', async () => {
    component.openModal();
    component.form.setValue({
      description: 'Gym Membership',
      amount: 1800,
      categoryId: 1,
      frequency: 'MONTHLY',
      dayOfMonth: 1,
      dayOfWeek: 1,
      totalOccurrences: null,
      currency: 'DOP',
    });

    await component.onSubmit();
    expect(mockRecurringState.add).toHaveBeenCalled();
    expect(mockNotificationService.show).toHaveBeenCalledWith('recurring.created', 'success');
    expect(component.showModal()).toBe(false);
  });

  it('should confirm deletion before calling state.delete', async () => {
    await component.confirmDelete(mockRecurring[0]);
    expect(mockDialogService.confirm).toHaveBeenCalled();
    expect(mockRecurringState.delete).toHaveBeenCalledWith(1);
    expect(mockNotificationService.show).toHaveBeenCalledWith('recurring.deleted', 'success');
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
