import { describe, it, expect } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { CategoryBadgeComponent } from './category-badge.component';
import { ListRowComponent } from './list-row.component';
import { EmptyStateComponent } from './empty-state.component';
import { PageHeaderComponent } from './page-header.component';
import { PaginationComponent } from './pagination.component';
import { MonthSelectorComponent } from './month-selector.component';
import { UiDialogService } from '../organisms/dialog.service';

describe('Shared UI Molecules', () => {
  describe('CategoryBadgeComponent', () => {
    @Component({
      standalone: true,
      imports: [CategoryBadgeComponent],
      template: `<ui-category-badge [name]="name" [color]="color" [icon]="icon" [size]="size" />`,
    })
    class TestHost {
      name = 'Food';
      color = '#10b981';
      icon = 'restaurant';
      size: 'sm' | 'md' = 'md';
    }

    it('renders category name and styled background', () => {
      const fixture = TestBed.createComponent(TestHost);
      fixture.detectChanges();

      const span = fixture.debugElement.query(By.css('span.inline-flex'));
      expect(span).toBeTruthy();
      expect(span.nativeElement.textContent).toContain('Food');
      // background should be rgba(16, 185, 129, 0.15)
      expect(span.nativeElement.style.backgroundColor).toContain('rgba(16, 185, 129, 0.15)');
    });
  });

  describe('ListRowComponent', () => {
    @Component({
      standalone: true,
      imports: [ListRowComponent],
      template: `
        <ui-list-row [interactive]="interactive()" (rowClick)="clicked = true">
          <span uiRowLeading>Icon</span>
          <span>Main title</span>
          <span uiRowTrailing>RD$ 500</span>
          <span uiRowBelow>Progress bar</span>
        </ui-list-row>
      `,
    })
    class RowTestHost {
      interactive = signal(false);
      clicked = false;
    }

    it('renders div when non-interactive and button when interactive', () => {
      const fixture = TestBed.createComponent(RowTestHost);
      fixture.detectChanges();

      expect(fixture.debugElement.query(By.css('button'))).toBeNull();
      expect(fixture.debugElement.query(By.css('div.w-full'))).toBeTruthy();
      expect(fixture.nativeElement.textContent).toContain('Main title');

      fixture.componentInstance.interactive.set(true);
      fixture.detectChanges();

      const btn = fixture.debugElement.query(By.css('button'));
      expect(btn).toBeTruthy();

      btn.nativeElement.click();
      expect(fixture.componentInstance.clicked).toBe(true);
    });
  });

  describe('EmptyStateComponent', () => {
    @Component({
      standalone: true,
      imports: [EmptyStateComponent],
      template: `
        <ui-empty-state
          [icon]="'savings'"
          [title]="'No budgets found'"
          [description]="'Create a budget to get started.'"
        >
          <button uiEmptyAction>Add Budget</button>
        </ui-empty-state>
      `,
    })
    class EmptyTestHost {}

    it('renders title, description and projected action', () => {
      const fixture = TestBed.createComponent(EmptyTestHost);
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('No budgets found');
      expect(fixture.nativeElement.textContent).toContain('Create a budget to get started.');
      expect(fixture.nativeElement.textContent).toContain('Add Budget');
    });
  });

  describe('PageHeaderComponent', () => {
    @Component({
      standalone: true,
      imports: [PageHeaderComponent],
      template: `
        <ui-page-header [title]="'Gastos'" [subtitle]="'Registro de egresos'">
          <button uiHeaderActions>Nuevo</button>
        </ui-page-header>
      `,
    })
    class HeaderTestHost {}

    it('renders title, subtitle and projected actions', () => {
      const fixture = TestBed.createComponent(HeaderTestHost);
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('Gastos');
      expect(fixture.nativeElement.textContent).toContain('Registro de egresos');
      expect(fixture.nativeElement.textContent).toContain('Nuevo');
    });
  });

  describe('PaginationComponent', () => {
    @Component({
      standalone: true,
      imports: [PaginationComponent],
      template: `
        <ui-pagination
          [page]="page"
          [totalPages]="totalPages"
          (pageChange)="onPageChange($event)"
        />
      `,
    })
    class PagingTestHost {
      page = 0;
      totalPages = 5;
      lastEmitted: number | null = null;
      onPageChange(p: number) {
        this.lastEmitted = p;
        this.page = p;
      }
    }

    it('navigates and clamps correctly', () => {
      const fixture = TestBed.createComponent(PagingTestHost);
      fixture.detectChanges();

      const prevBtn = fixture.debugElement.query(By.css('button[aria-label="Previous page"]'));
      const nextBtn = fixture.debugElement.query(By.css('button[aria-label="Next page"]'));

      expect(prevBtn.nativeElement.disabled).toBe(true);
      expect(nextBtn.nativeElement.disabled).toBe(false);

      nextBtn.nativeElement.click();
      fixture.detectChanges();

      expect(fixture.componentInstance.lastEmitted).toBe(1);
      expect(prevBtn.nativeElement.disabled).toBe(false);
    });
  });

  describe('MonthSelectorComponent', () => {
    it('shifts month on previous click', () => {
      const mockDialogService = {
        open: () => ({ closed: { subscribe: () => {} } }),
      };

      TestBed.configureTestingModule({
        providers: [
          { provide: UiDialogService, useValue: mockDialogService },
        ],
      });

      const fixture = TestBed.createComponent(MonthSelectorComponent);
      const initialDate = new Date(2026, 5, 15); // June 2026
      fixture.componentRef.setInput('value', initialDate);
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('2026');

      const prevBtn = fixture.debugElement.query(By.css('button[aria-label="Mes anterior"]'));
      prevBtn.nativeElement.click();
      fixture.detectChanges();

      const updated = fixture.componentInstance.value();
      expect(updated.getMonth()).toBe(4); // May
    });
  });
});
