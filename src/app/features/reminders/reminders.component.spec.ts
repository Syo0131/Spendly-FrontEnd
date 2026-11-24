import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RemindersComponent } from './reminders.component';
import { RemindersStateService } from '../../core/services/reminders-state.service';
import { NotificationService } from '../../core/services/notification.service';
import { UiDialogService } from '../../shared/ui';
import { signal } from '@angular/core';
import { RemindersResponseDto } from '../../core/models/api.models';

describe('RemindersComponent', () => {
  let component: RemindersComponent;
  let fixture: ComponentFixture<RemindersComponent>;

  const mockReminders: RemindersResponseDto[] = [
    {
      id: 1,
      title: 'Pay Electricity Bill',
      message: 'Monthly electricity bill due',
      amount: 3500,
      remindAt: '2026-12-01T10:00:00',
    },
    {
      id: 2,
      title: 'Car Insurance',
      message: 'Quarterly payment',
      amount: 12000,
      remindAt: '2026-12-15T15:00:00',
    },
  ];

  let mockState: any;
  let mockNotificationService: any;
  let mockDialogService: any;

  beforeEach(async () => {
    mockState = {
      reminders: signal<RemindersResponseDto[]>(mockReminders),
      isLoading: signal<boolean>(false),
      currentPage: signal<number>(0),
      totalPages: signal<number>(1),
      setPage: vi.fn(),
      add: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({}),
      delete: vi.fn().mockResolvedValue({}),
    };

    mockNotificationService = {
      show: vi.fn(),
    };

    mockDialogService = {
      confirm: vi.fn().mockResolvedValue(true),
    };

    await TestBed.configureTestingModule({
      imports: [RemindersComponent],
      providers: [
        { provide: RemindersStateService, useValue: mockState },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: UiDialogService, useValue: mockDialogService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RemindersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and display reminders list', () => {
    expect(component).toBeTruthy();
    expect(component.state.reminders().length).toBe(2);
  });

  it('should open modal for create and reset form', () => {
    component.openModal();
    expect(component.showModal()).toBe(true);
    expect(component.isEditing()).toBe(false);
    expect(component.editingId()).toBeNull();
    expect(component.form.value.title).toBe('');
  });

  it('should open modal for edit and patch form values', () => {
    component.edit(mockReminders[0]);
    expect(component.showModal()).toBe(true);
    expect(component.isEditing()).toBe(true);
    expect(component.editingId()).toBe(1);
    expect(component.form.value.title).toBe('Pay Electricity Bill');
    expect(component.form.value.amount).toBe(3500);
  });

  it('should close modal and reset form', () => {
    component.openModal();
    component.closeModal();
    expect(component.showModal()).toBe(false);
    expect(component.editingId()).toBeNull();
  });

  it('should submit add reminder when form is valid', async () => {
    component.openModal();
    component.form.setValue({
      title: 'Water Bill',
      message: 'Pay water utility',
      amount: 800,
      remindAt: '2026-12-05T09:00',
    });

    await component.submit();

    expect(mockState.add).toHaveBeenCalledWith({
      title: 'Water Bill',
      message: 'Pay water utility',
      amount: 800,
      remindAt: '2026-12-05T09:00:00',
    });
    expect(mockNotificationService.show).toHaveBeenCalled();
    expect(component.showModal()).toBe(false);
  });

  it('should submit update reminder when editing', async () => {
    component.edit(mockReminders[0]);
    component.form.patchValue({
      title: 'Updated Electricity Bill',
      amount: 3800,
    });

    await component.submit();

    expect(mockState.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        title: 'Updated Electricity Bill',
        amount: 3800,
      })
    );
    expect(mockNotificationService.show).toHaveBeenCalled();
    expect(component.showModal()).toBe(false);
  });

  it('should confirm before deleting a reminder', async () => {
    mockDialogService.confirm.mockResolvedValue(true);

    await component.confirmDelete(mockReminders[0]);

    expect(mockDialogService.confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        tone: 'danger',
      })
    );
    expect(mockState.delete).toHaveBeenCalledWith(1);
    expect(mockNotificationService.show).toHaveBeenCalled();
  });

  it('should not delete when user cancels confirmation', async () => {
    mockDialogService.confirm.mockResolvedValue(false);

    await component.confirmDelete(mockReminders[0]);

    expect(mockDialogService.confirm).toHaveBeenCalled();
    expect(mockState.delete).not.toHaveBeenCalled();
  });

  it('should handle keyboard shortcuts', () => {
    // Alt+N opens modal
    component.handleKeyboardEvent(new KeyboardEvent('keydown', { key: 'n', altKey: true }));
    expect(component.showModal()).toBe(true);

    // Escape closes modal
    component.handleKeyboardEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(component.showModal()).toBe(false);
  });
});
