import { describe, it, expect } from 'vitest';
import { buildCategorySpendingRows } from './category-spending';
import { Budget, Category, MonthlyStats } from '../models/api.models';

describe('buildCategorySpendingRows', () => {
  const categories: Category[] = [
    { id: 1, name: 'Food', color: '#10b981', icons: 'restaurant' },
    { id: 2, name: 'Home', color: '#6366f1', icons: 'home' },
    { id: 3, name: 'Transport', color: '#f59e0b', icons: 'directions_car' },
    { id: 4, name: 'Leisure', color: '#ec4899', icons: 'sports_esports' },
  ];

  it('filters out zero-spent categories and sorts descending by spent', () => {
    const stats: MonthlyStats = {
      Food: 45200,
      Home: 38000,
      Transport: 18900,
      Leisure: 0,
      Ghost: 500,
    };

    const rows = buildCategorySpendingRows(stats, [], categories);

    // Leisure (0) should be excluded
    expect(rows.length).toBe(4);
    expect(rows.map((r) => r.categoryName)).toEqual(['Food', 'Home', 'Transport', 'Ghost']);

    // Share of total: 45200 / 102600 = 44%
    expect(rows[0].shareOfTotal).toBe(44);

    // Ghost has no matching category
    expect(rows[3].categoryId).toBeNull();
    expect(rows[3].color).toBeNull();
    expect(rows[3].icon).toBeNull();
    expect(rows[3].spent).toBe(500);
  });

  it('matches budgets prioritizing MONTHLY over YEARLY and picking latest startDate', () => {
    const stats: MonthlyStats = {
      Food: 45200,
      Home: 38000,
      Transport: 18900,
    };

    const budgets: Budget[] = [
      // Older monthly budget for Food
      {
        id: 101,
        limit: 40000,
        spent: 35000,
        percentage: 87,
        period: 'MONTHLY',
        categoryId: 1,
        category: categories[0],
        startDate: '2026-10-01T00:00:00Z',
        endDate: '2026-10-31T23:59:59Z',
      },
      // Newer monthly budget for Food (should win: limit 50000, spent 45200)
      {
        id: 102,
        limit: 50000,
        spent: 45200,
        percentage: 90,
        period: 'MONTHLY',
        categoryId: 1,
        category: categories[0],
        startDate: '2026-11-01T00:00:00Z',
        endDate: '2026-11-30T23:59:59Z',
      },
      // Yearly budget for Home
      {
        id: 103,
        limit: 500000,
        spent: 120000,
        percentage: 24,
        period: 'YEARLY',
        categoryId: 2,
        category: categories[1],
        startDate: '2026-01-01T00:00:00Z',
        endDate: '2026-12-31T23:59:59Z',
      },
      // Weekly budget for Transport (should be ignored)
      {
        id: 104,
        limit: 5000,
        spent: 3000,
        percentage: 60,
        period: 'WEEKLY',
        categoryId: 3,
        category: categories[2],
        startDate: '2026-11-20T00:00:00Z',
        endDate: '2026-11-27T23:59:59Z',
      },
    ];

    const rows = buildCategorySpendingRows(stats, budgets, categories);

    // Food row
    const foodRow = rows.find((r) => r.categoryName === 'Food');
    expect(foodRow).toBeDefined();
    expect(foodRow?.budget).toEqual({
      scope: 'month',
      spent: 45200,
      limit: 50000,
      percent: 90,
      status: 'critical',
    });

    // Home row
    const homeRow = rows.find((r) => r.categoryName === 'Home');
    expect(homeRow).toBeDefined();
    expect(homeRow?.budget).toEqual({
      scope: 'year',
      spent: 120000,
      limit: 500000,
      percent: 24,
      status: 'ok',
    });

    // Transport row (weekly is ignored)
    const transportRow = rows.find((r) => r.categoryName === 'Transport');
    expect(transportRow).toBeDefined();
    expect(transportRow?.budget).toBeNull();
  });

  it('returns empty array when stats is empty or all zeroes', () => {
    expect(buildCategorySpendingRows({}, [], categories)).toEqual([]);
    expect(buildCategorySpendingRows({ Leisure: 0, Food: -10 }, [], categories)).toEqual([]);
  });
});
