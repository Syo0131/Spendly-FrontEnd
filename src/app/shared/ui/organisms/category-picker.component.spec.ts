import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OverlayModule } from '@angular/cdk/overlay';
import { CategoryPickerComponent } from './category-picker.component';
import { Category } from '../../../core/models/api.models';

describe('CategoryPickerComponent', () => {
  let fixture: ComponentFixture<CategoryPickerComponent>;
  let component: CategoryPickerComponent;

  const mockCategories: Category[] = [
    { id: 1, name: 'Food', color: '#ff0000', icons: 'restaurant' },
    { id: 2, name: 'Transport', color: '#00ff00', icons: 'directions_car' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OverlayModule, CategoryPickerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryPickerComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('categories', mockCategories);
    fixture.componentRef.setInput('placeholder', 'Select category');
    fixture.componentRef.setInput('label', 'Category');
    fixture.detectChanges();
  });

  it('opening it, then ArrowDown + Enter sets form value to second category id', async () => {
    let selectedId: number | null = null;
    component.registerOnChange((val: number | null) => {
      selectedId = val;
    });

    component.open();
    fixture.detectChanges();
    await new Promise((r) => setTimeout(r, 20));

    expect(component.isOpen()).toBe(true);

    // One ArrowDown moves highlightedIndex from 0 (Food) to 1 (Transport)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    fixture.detectChanges();
    await new Promise((r) => setTimeout(r, 20));

    expect(selectedId).toBe(2);
    expect(component.isOpen()).toBe(false);
  });

  it('Escape closes the overlay without changing value', async () => {
    let selectedId: number | null = null;
    component.registerOnChange((val: number | null) => {
      selectedId = val;
    });

    component.open();
    fixture.detectChanges();
    await new Promise((r) => setTimeout(r, 20));

    expect(component.isOpen()).toBe(true);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    await new Promise((r) => setTimeout(r, 20));

    expect(component.isOpen()).toBe(false);
    expect(selectedId).toBeNull();
  });
});
