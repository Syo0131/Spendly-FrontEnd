import { TestBed } from '@angular/core/testing';
import { ToggleComponent } from './toggle.component';

describe('ToggleComponent', () => {
  function knobClasses(checked: boolean): string[] {
    const fixture = TestBed.createComponent(ToggleComponent);
    fixture.componentRef.setInput('checked', checked);
    fixture.detectChanges();
    return [...fixture.nativeElement.querySelector('button[role="switch"] > span').classList];
  }

  it('rests the knob at translate-x-0.5 when off', () => {
    const classes = knobClasses(false);
    expect(classes).toContain('translate-x-0.5');
    expect(classes).not.toContain('translate-x-5');
  });

  it('moves the knob to translate-x-5 when on', () => {
    const classes = knobClasses(true);
    expect(classes).toContain('translate-x-5');
    expect(classes).not.toContain('translate-x-0.5');
  });
});
