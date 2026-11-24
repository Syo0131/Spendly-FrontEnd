import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { BudgetStateService } from './budget-state.service';
import { ApiService } from './api.service';
import { CacheService } from './cache.service';
import { Budget } from '../models/api.models';

describe('BudgetStateService keeps spent from the API', () => {
  let service: BudgetStateService;
  let apiMock: Partial<ApiService>;

  const mockBudget = {
    id: 1,
    period: 'MONTHLY',
    spent: 300,
    limit: 1000,
    category: {
      id: 5,
      name: 'Food',
      color: '#000',
      icons: 'restaurant',
    },
  } as unknown as Budget;

  beforeEach(() => {
    apiMock = {
      getMonthlyBudgets: vi.fn().mockReturnValue(of([mockBudget])),
      getExpensesByCategory: vi.fn().mockReturnValue(of({ Food: 999 })),
    };

    TestBed.configureTestingModule({
      providers: [
        BudgetStateService,
        { provide: ApiService, useValue: apiMock },
        {
          provide: CacheService,
          useValue: {
            get: vi.fn().mockReturnValue(null),
            set: vi.fn(),
            clear: vi.fn(),
          },
        },
      ],
    });

    service = TestBed.inject(BudgetStateService);
  });

  it('keeps the spent value returned by the API instead of overwriting with stats', async () => {
    TestBed.flushEffects();
    const budgets = service.filteredBudgets();
    expect(budgets.length).toBe(1);
    expect(budgets[0].spent).toBe(300);
  });

  it('keeps the spent value returned by the API when stats has no entry', async () => {
    (apiMock.getExpensesByCategory as any).mockReturnValue(of({}));
    service.refresh();
    TestBed.flushEffects();
    const budgets = service.filteredBudgets();
    expect(budgets.length).toBe(1);
    expect(budgets[0].spent).toBe(300);
  });
});
