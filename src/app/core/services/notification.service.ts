import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
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

  show(
    message: string,
    type: 'success' | 'error' | 'info' = 'info',
    duration: number = 3000,
    action?: { label: string; onClick: () => void }
  ) {
    const id = Date.now();
    const toast: Toast = { id, message, type, duration, action };
    this.toasts.update((current) => [...current, toast]);

    // 2. Add to history log
    const newLog: NotificationLog = {
      id: id.toString(), // Convert number ID to string for NotificationLog
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

  dismissToast(id: number) {
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
