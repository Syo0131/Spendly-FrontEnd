import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CacheService {
  private readonly TTL = 120000; // 2 minutes
  private readonly CACHE_PREFIX = 'spendly_cache_';

  constructor() {}

  private getFullKey(key: string): string {
    return this.CACHE_PREFIX + key;
  }

  set(key: string, data: any): void {
    const item = {
      data,
      timestamp: Date.now(),
    };
    try {
      localStorage.setItem(this.getFullKey(key), JSON.stringify(item));
    } catch (e) {
      console.warn('Error saving to cache', e);
    }
  }

  get(key: string, ignoreTTL = false): any | null {
    try {
      const fullKey = this.getFullKey(key);
      const itemStr = localStorage.getItem(fullKey);
      if (!itemStr) return null;

      const item = JSON.parse(itemStr);
      const now = Date.now();

      if (!ignoreTTL && now - item.timestamp > this.TTL) {
        localStorage.removeItem(fullKey);
        return null;
      }

      return item.data;
    } catch (e) {
      return null;
    }
  }

  invalidate(pattern: string): void {
    const target = this.getFullKey(pattern);
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(target)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));
  }

  clear(): void {
    this.invalidate('');
  }
}
