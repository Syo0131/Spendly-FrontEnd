import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

export interface NotificationLog {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  timestamp: Date;
  read: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  // Active Toasts (Transient)
  toasts = signal<Toast[]>([]);

  // Notification History (Persistent for session)
  history = signal<NotificationLog[]>([]);
  unreadCount = signal(0);

  constructor() {}

  show(type: 'success' | 'error' | 'info', message: string, duration: number = 3000) {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);

    // 1. Add to active toasts
    const newToast: Toast = { id, message, type, duration };
    this.toasts.update((current) => [...current, newToast]);

    // 2. Add to history log
    const newLog: NotificationLog = {
      id,
      message,
      type,
      timestamp: new Date(),
      read: false,
    };
    this.history.update((current) => [newLog, ...current]);
    this.updateUnreadCount();

    // Auto dismiss toast
    if (duration > 0) {
      setTimeout(() => {
        this.dismissToast(id);
      }, duration);
    }
  }

  dismissToast(id: string) {
    this.toasts.update((current) => current.filter((t) => t.id !== id));
  }

  markAsRead(id: string) {
    this.history.update((current) => current.map((n) => (n.id === id ? { ...n, read: true } : n)));
    this.updateUnreadCount();
  }

  markAllAsRead() {
    this.history.update((current) => current.map((n) => ({ ...n, read: true })));
    this.updateUnreadCount();
  }

  clearHistory() {
    this.history.set([]);
    this.updateUnreadCount();
  }

  private updateUnreadCount() {
    this.unreadCount.set(this.history().filter((n) => !n.read).length);
  }
}
