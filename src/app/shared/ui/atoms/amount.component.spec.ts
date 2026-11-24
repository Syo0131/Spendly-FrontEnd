import { describe, it, expect } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AmountComponent } from './amount.component';

describe('AmountComponent', () => {
  let fixture: ComponentFixture<AmountComponent>;
  let component: AmountComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AmountComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AmountComponent);
    component = fixture.componentInstance;
  });

  it('formats positive amount in DOP with tabular-nums', () => {
    fixture.componentRef.setInput('value', 142300);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('142,300');
    expect(text).toMatch(/RD\$/);
  });

  it('applies text-income class when tone is income', () => {
    fixture.componentRef.setInput('value', 5000);
    fixture.componentRef.setInput('tone', 'income');
    fixture.detectChanges();

    const span = fixture.nativeElement.querySelector('span');
    expect(span.classList.contains('text-income')).toBe(true);
  });

  it('applies text-expense class when tone is expense', () => {
    fixture.componentRef.setInput('value', 2500);
    fixture.componentRef.setInput('tone', 'expense');
    fixture.detectChanges();

    const span = fixture.nativeElement.querySelector('span');
    expect(span.classList.contains('text-expense')).toBe(true);
  });
});
