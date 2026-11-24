import { describe, it, expect } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProgressBarComponent } from './progress-bar.component';

describe('ProgressBarComponent', () => {
  let fixture: ComponentFixture<ProgressBarComponent>;
  let component: ProgressBarComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProgressBarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProgressBarComponent);
    component = fixture.componentInstance;
  });

  it('clamps width to 100% when percent is 130 and keeps real aria-valuenow="130"', () => {
    fixture.componentRef.setInput('percent', 130);
    fixture.componentRef.setInput('label', 'Food budget progress');
    fixture.detectChanges();

    const host = fixture.nativeElement.querySelector('[role="progressbar"]');
    expect(host).not.toBeNull();
    expect(host.getAttribute('aria-valuenow')).toBe('130');
    expect(host.getAttribute('aria-label')).toBe('Food budget progress');

    const fill = host.querySelector('.progress-fill');
    expect(fill.style.width).toBe('100%');
  });

  it('clamps width to 0% when percent is -5', () => {
    fixture.componentRef.setInput('percent', -5);
    fixture.componentRef.setInput('label', 'Progress');
    fixture.detectChanges();

    const fill = fixture.nativeElement.querySelector('.progress-fill');
    expect(fill.style.width).toBe('0%');
  });

  it('applies bg-status-critical class when status is critical', () => {
    fixture.componentRef.setInput('percent', 95);
    fixture.componentRef.setInput('status', 'critical');
    fixture.componentRef.setInput('label', 'Critical budget');
    fixture.detectChanges();

    const fill = fixture.nativeElement.querySelector('.progress-fill');
    expect(fill.classList.contains('bg-status-critical')).toBe(true);
  });

  it('applies bg-bar-neutral class when status is neutral', () => {
    fixture.componentRef.setInput('percent', 50);
    fixture.componentRef.setInput('status', 'neutral');
    fixture.componentRef.setInput('label', 'Neutral progress');
    fixture.detectChanges();

    const fill = fixture.nativeElement.querySelector('.progress-fill');
    expect(fill.classList.contains('bg-bar-neutral')).toBe(true);
  });
});
