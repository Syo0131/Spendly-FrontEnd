import { describe, it, expect } from 'vitest';
import { isDevMode } from '@angular/core';
import { routes } from './app.routes';

describe('App Routes - __ui showcase route', () => {
  it('defines __ui route with canMatch guard matching isDevMode', () => {
    const uiRoute = routes.find((r) => r.path === '__ui');
    expect(uiRoute).toBeDefined();
    expect(uiRoute?.canMatch).toBeDefined();
    expect(uiRoute?.canMatch?.length).toBe(1);

    const guard = uiRoute?.canMatch?.[0] as () => boolean;
    expect(guard()).toBe(isDevMode());
  });
});
