import { Injectable, signal } from '@angular/core';

export interface Notification {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
}

@Injectable({
    providedIn: 'root'
})
export class NotifyService {
    public notifications = signal<Notification[]>([]);
    private counter = 0;

    show(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') {
        const id = this.counter++;
        this.notifications.update(prev => [...prev, { id, message, type }]);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            this.notifications.update(prev => prev.filter(n => n.id !== id));
        }, 5000);
    }

    success(message: string) { this.show(message, 'success'); }
    error(message: string) { this.show(message, 'error'); }
    info(message: string) { this.show(message, 'info'); }
    warning(message: string) { this.show(message, 'warning'); }
}
