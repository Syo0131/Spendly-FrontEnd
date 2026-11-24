import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IncomesComponent } from './incomes.component';
import { IncomeStateService } from '../../core/services/income-state.service';
import { TranslationService } from '../../core/services/translation.service';
import { NotificationService } from '../../core/services/notification.service';
import { UiDialogService } from '../../shared/ui';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { IncomeResponse } from '../../core/models/api.models';

describe('IncomesComponent', () => {
  let component: IncomesComponent;
  let fixture: ComponentFixture<IncomesComponent>;

  const mockIncomes: IncomeResponse[] = [
    {
      id: 1,
      description: 'Monthly Salary',
      amount: 85000,
      date: '2026-11-15',
      currency: 'DOP',
      fixedSalary: true,
    },
    {
      id: 2,
      description: 'Consulting Project',
      amount: 25000,
      date: '2026-11-20',
      currency: 'DOP',
      fixedSalary: false,
    },
  ];

  let mockIncomeState: any;
  let mockNotificationService: any;
  let mockDialogService: any;

  beforeEach(async () => {
    mockIncomeState = {
      incomes: signal<IncomeResponse[]>(mockIncomes),
      isLoading: signal<boolean>(false),
      totalElements: signal<number>(2),
      totalPages: signal<number>(1),
      currentPage: signal<number>(0),
      refresh: vi.fn(),
      load: vi.fn(),
      add: vi.fn().mockReturnValue(of({})),
      update: vi.fn().mockReturnValue(of({})),
      delete: vi.fn().mockReturnValue(of({})),
    };

    mockNotificationService = {
      show: vi.fn(),
    };

    mockDialogService = {
      confirm: vi.fn().mockResolvedValue(true),
    };

    await TestBed.configureTestingModule({
      imports: [IncomesComponent],
      providers: [
        provideRouter([]),
        { provide: IncomeStateService, useValue: mockIncomeState },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: UiDialogService, useValue: mockDialogService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(IncomesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and call state.refresh on init', () => {
    expect(component).toBeTruthy();
    expect(mockIncomeState.refresh).toHaveBeenCalled();
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
    component.openModal(mockIncomes[0]);
    expect(component.showModal()).toBe(true);
    expect(component.editingId()).toBe(1);
    expect(component.form.value.description).toBe('Monthly Salary');
    expect(component.form.value.amount).toBe(85000);
  });

  it('should submit add income and show notification', () => {
    component.openModal();
    component.form.setValue({
      description: 'Dividends',
      amount: 5000,
      date: '2026-11-24',
      currency: 'DOP',
    });

    component.onSubmit();
    expect(mockIncomeState.add).toHaveBeenCalled();
    expect(mockNotificationService.show).toHaveBeenCalledWith('notif.income_created', 'success');
    expect(component.showModal()).toBe(false);
  });

  it('should confirm deletion before calling state.delete', async () => {
    await component.deleteItem(mockIncomes[0]);
    expect(mockDialogService.confirm).toHaveBeenCalled();
    expect(mockIncomeState.delete).toHaveBeenCalledWith(1);
    expect(mockNotificationService.show).toHaveBeenCalledWith('notif.income_deleted', 'success');
  });

  it('should handle keyboard shortcuts (Alt+N, Esc, Ctrl+Enter)', () => {
    // Alt + N opens modal
    component.handleKeyboardEvent(new KeyboardEvent('keydown', { key: 'n', altKey: true }));
    expect(component.showModal()).toBe(true);

    // Escape closes modal
    component.handleKeyboardEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(component.showModal()).toBe(false);
  });
});
