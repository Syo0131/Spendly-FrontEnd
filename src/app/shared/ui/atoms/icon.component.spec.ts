import { describe, it, expect } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IconComponent } from './icon.component';

describe('IconComponent', () => {
  let fixture: ComponentFixture<IconComponent>;
  let component: IconComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IconComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(IconComponent);
    component = fixture.componentInstance;
  });

  it('renders icon with aria-hidden when label is undefined', () => {
    fixture.componentRef.setInput('name', 'restaurant');
    fixture.detectChanges();

    const span = fixture.nativeElement.querySelector('span');
    expect(span.getAttribute('aria-hidden')).toBe('true');
    expect(span.getAttribute('role')).toBeNull();
    expect(span.textContent.trim()).toBe('restaurant');
  });

  it('renders icon with role="img" and aria-label when label is provided', () => {
    fixture.componentRef.setInput('name', 'restaurant');
    fixture.componentRef.setInput('label', 'Restaurant icon');
    fixture.detectChanges();

    const span = fixture.nativeElement.querySelector('span');
    expect(span.getAttribute('aria-hidden')).toBeNull();
    expect(span.getAttribute('role')).toBe('img');
    expect(span.getAttribute('aria-label')).toBe('Restaurant icon');
  });

  it('falls back to category when unknown name is given', () => {
    fixture.componentRef.setInput('name', 'unknown_xyz');
    fixture.detectChanges();

    const span = fixture.nativeElement.querySelector('span');
    expect(span.textContent.trim()).toBe('category');
  });
});
