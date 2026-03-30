import { Injectable, signal } from '@angular/core';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: number;
  message: string;
  type: NotificationType;
}

const DEFAULT_DURATION = 4000;

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private _nextId = 0;
  readonly notifications = signal<Notification[]>([]);

  show(message: string, type: NotificationType = 'info', duration = DEFAULT_DURATION): void {
    const id = this._nextId++;
    this.notifications.update((list) => [...list, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }
  }

  success(message: string, duration = DEFAULT_DURATION): void {
    this.show(message, 'success', duration);
  }

  error(message: string, duration = DEFAULT_DURATION): void {
    this.show(message, 'error', duration);
  }

  warning(message: string, duration = DEFAULT_DURATION): void {
    this.show(message, 'warning', duration);
  }

  info(message: string, duration = DEFAULT_DURATION): void {
    this.show(message, 'info', duration);
  }

  dismiss(id: number): void {
    this.notifications.update((list) => list.filter((n) => n.id !== id));
  }
}
