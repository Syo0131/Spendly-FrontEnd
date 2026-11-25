import { TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { ExpenseStateService } from './expense-state.service';
import { ApiService } from './api.service';
import { CacheService } from './cache.service';
import { BudgetStateService } from './budget-state.service';
import { ExpenseResponse, PagedResponse } from '../models/api.models';

function expense(id: number, date: string, categoryId: number): ExpenseResponse {
  return {
    id,
    description: `e${id}`,
    amount: id,
    date,
    currency: 'DOP',
    category: { id: categoryId, name: `c${categoryId}`, color: '#000', icons: 'restaurant' },
  } as unknown as ExpenseResponse;
}

function paged(
  items: ExpenseResponse[],
  number: number,
  totalPages: number,
  totalElements: number,
) {
  return {
    content: items,
    page: { size: items.length, number, totalElements, totalPages },
  } as PagedResponse<ExpenseResponse>;
}

describe('ExpenseStateService loads only what the current view needs', () => {
  let service: ExpenseStateService;
  let api: {
    getExpenses: ReturnType<typeof vi.fn>;
    getExpensesForMonth: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    api = {
      getExpenses: vi.fn((page: number, size: number) => {
        if (size === 6) {
          return of(paged([expense(page * 10 + 1, '2026-11-24', 1)], page, 246, 1476));
        }
        // Full download pages (size 100): 2 pages in total.
        return of(
          paged(
            page === 0
              ? [expense(1, '2026-11-24', 1), expense(2, '2026-10-02', 2)]
              : [expense(3, '2025-01-05', 2)],
            page,
            2,
            3,
          ),
        );
      }),
      getExpensesForMonth: vi.fn(() =>
        of([expense(7, '2026-11-24', 1), expense(8, '2026-11-20', 2), expense(9, '2026-11-01', 2)]),
      ),
    };

    TestBed.configureTestingModule({
      providers: [
        ExpenseStateService,
        { provide: ApiService, useValue: api },
        { provide: BudgetStateService, useValue: { refresh: vi.fn() } },
        {
          provide: CacheService,
          useValue: { get: vi.fn().mockReturnValue(null), set: vi.fn(), invalidate: vi.fn() },
        },
      ],
    });
    service = TestBed.inject(ExpenseStateService);
  });

  function settle() {
    TestBed.tick();
  }

  it('without filters requests one server page of the page size and uses the server total', () => {
    service.refresh();
    settle();

    expect(api.getExpenses).toHaveBeenCalledTimes(1);
    expect(api.getExpenses).toHaveBeenCalledWith(0, 6);
    expect(api.getExpensesForMonth).not.toHaveBeenCalled();
    expect(service.expenses().map((e) => e.id)).toEqual([1]);
    expect(service.totalElements()).toBe(1476);
    expect(service.totalPages()).toBe(246);
  });

  it('without filters requests the next server page on page change', () => {
    service.refresh();
    settle();
    service.load(1, 6);
    settle();

    expect(api.getExpenses).toHaveBeenLastCalledWith(1, 6);
    expect(service.expenses().map((e) => e.id)).toEqual([11]);
  });

  it('with a month filter requests that month once and filters categories locally', () => {
    service.setDateFilter(11, 2026);
    service.refresh();
    settle();

    expect(api.getExpensesForMonth).toHaveBeenCalledTimes(1);
    expect(api.getExpensesForMonth).toHaveBeenCalledWith(2026, 11);
    expect(api.getExpenses).not.toHaveBeenCalled();
    expect(service.totalElements()).toBe(3);

    service.setFilter(2);
    settle();

    expect(api.getExpensesForMonth).toHaveBeenCalledTimes(1);
    expect(service.expenses().map((e) => e.id)).toEqual([8, 9]);
    expect(service.totalElements()).toBe(2);
  });

  it('with a category filter over all time downloads the full history once', () => {
    service.setFilter(2);
    service.refresh();
    settle();

    expect(api.getExpenses).toHaveBeenCalledWith(0, 100);
    expect(api.getExpenses).toHaveBeenCalledWith(1, 100);
    expect(service.expenses().map((e) => e.id)).toEqual([2, 3]);
    expect(service.totalElements()).toBe(2);
  });

  it('removes a deleted expense from the current page right away', () => {
    // Server has not answered yet: the item must already be gone.
    (api as any).deleteExpense = vi.fn(() => new Subject());
    service.refresh();
    settle();

    service.delete(1).subscribe();

    expect(service.expenses()).toEqual([]);
    expect(service.totalElements()).toBe(1475);
  });
});
