import { describe, it, expect } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { CategorySpendingListComponent } from './category-spending-list.component';
import { CategorySpendingRow } from '../../core/utils/category-spending';
import { TranslationService } from '../../core/services/translation.service';

describe('CategorySpendingListComponent', () => {
  let fixture: ComponentFixture<CategorySpendingListComponent>;
  let component: CategorySpendingListComponent;

  const mockTranslationService = {
    t: () => (key: string, params?: any) => {
      if (params) return `${key}:${JSON.stringify(params)}`;
      return key;
    },
    translateCategory: (name: string) => name,
  };

  const sampleRows: CategorySpendingRow[] = [
    {
      categoryName: 'Supermercado',
      categoryId: 1,
      color: '#10b981',
      icon: 'shopping_cart',
      spent: 45200,
      shareOfTotal: 60,
      budget: {
        scope: 'month',
        spent: 45200,
        limit: 50000,
        percent: 90,
        status: 'critical',
      },
    },
    {
      categoryName: 'Transporte',
      categoryId: 2,
      color: '#f59e0b',
      icon: 'directions_car',
      spent: 12000,
      shareOfTotal: 40,
      budget: null,
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CategorySpendingListComponent],
      providers: [
        provideRouter([]),
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    });

    fixture = TestBed.createComponent(CategorySpendingListComponent);
    component = fixture.componentInstance;
  });

  it('renders spending rows with categories and emits rowSelected on click', () => {
    fixture.componentRef.setInput('rows', sampleRows);
    fixture.componentRef.setInput('hasAnyBudget', true);
    fixture.detectChanges();

    const rowElements = fixture.debugElement.queryAll(By.css('ui-list-row'));
    expect(rowElements.length).toBe(2);

    expect(fixture.nativeElement.textContent).toContain('Supermercado');
    expect(fixture.nativeElement.textContent).toContain('Transporte');

    let emittedRow: CategorySpendingRow | null = null;
    component.rowSelected.subscribe((r) => (emittedRow = r));

    const firstRowBtn = rowElements[0].query(By.css('button'));
    firstRowBtn.nativeElement.click();

    expect(emittedRow).toEqual(sampleRows[0]);
  });

  it('renders empty state when rows is empty', () => {
    fixture.componentRef.setInput('rows', []);
    fixture.componentRef.setInput('hasAnyBudget', false);
    fixture.detectChanges();

    const emptyState = fixture.debugElement.query(By.css('ui-empty-state'));
    expect(emptyState).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('dashboard.no_expenses_title');
  });

  it('displays discreet hint when hasAnyBudget is false and rows exist', () => {
    fixture.componentRef.setInput('rows', sampleRows);
    fixture.componentRef.setInput('hasAnyBudget', false);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('dashboard.no_budgets_hint');
  });
});
