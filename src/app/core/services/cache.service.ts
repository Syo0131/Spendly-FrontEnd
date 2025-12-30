import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CacheService {
  private readonly TTL = 3600000; // 1 hour in ms (adjustable)

  constructor() {}

  set(key: string, data: any): void {
    const item = {
      data,
      timestamp: Date.now(),
    };
    try {
      localStorage.setItem(key, JSON.stringify(item));
    } catch (e) {
      console.warn('Error saving to cache', e);
    }
  }

  get(key: string): any | null {
    try {
      const itemStr = localStorage.getItem(key);
      if (!itemStr) return null;

      const item = JSON.parse(itemStr);
      const now = Date.now();

      // Optional: Check if expired.
      // For "Offline First" we might want to return expired data if network fails,
      // but for now let's respect TTL or return it anyway?
      // Strategy: Return data regardless of TTL if we want "stale-while-revalidate"?
      // Let's enforce TTL to avoid showing completely wrong ancient data.
      if (now - item.timestamp > this.TTL) {
        // Expired
        localStorage.removeItem(key);
        return null;
      }

      return item.data;
    } catch (e) {
      return null;
    }
  }

  clear(): void {
    localStorage.clear();
  }
}
