import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { NotifyService } from '../../services/notify.service';

@Injectable()
export class StoreConfigViewModel {
    private auth = inject(AuthService);
    private http = inject(HttpClient);
    private translate = inject(TranslateService);
    private notify = inject(NotifyService);

    public config = signal<any>({
        name: '',
        logo: '',
        domain: '',
        phone: '',
        description: '',
        socials: { instagram: '', facebook: '', twitter: '', website: '' },
        theme: { primaryColor: '#3b82f6', secondaryColor: '#10b981', backgroundColor: '#0f172a', textColor: '#ffffff' },
        billing: {
            vatPercentage: null,
            tipEnabled: false,
            tipPercentage: 0,
            tipDescription: 'La propina es opcional'
        },
        printers: []
    });

    public localConfig = signal<any>(this.loadLocal());

    public loading = signal<boolean>(true);
    public saving = signal<boolean>(false);
    public message = signal<string>('');

    public readonly predefinedThemes = [
        { id: 'midnight', name: 'Oscuro', colors: { primaryColor: '#6366f1', secondaryColor: '#a855f7', backgroundColor: '#09090b', textColor: '#f8fafc' } },
        { id: 'light', name: 'Claro', colors: { primaryColor: '#2563eb', secondaryColor: '#60a5fa', backgroundColor: '#f8fafc', textColor: '#0f172a' } },
        { id: 'emerald', name: 'Verde', colors: { primaryColor: '#10b981', secondaryColor: '#14b8a6', backgroundColor: '#022c22', textColor: '#f0fdf4' } },
        { id: 'ocean', name: 'Azul', colors: { primaryColor: '#0ea5e9', secondaryColor: '#3b82f6', backgroundColor: '#082f49', textColor: '#f0f9ff' } },
    ];

    private loadLocal(): any {
        const saved = localStorage.getItem('disher_local_config');
        return saved ? JSON.parse(saved) : null;
    }


    public selectPredefinedTheme(themeId: string) {
        const theme = this.predefinedThemes.find(t => t.id === themeId);
        if (theme) {
            const current = this.config();
            this.config.set({
                ...current,
                theme: { ...current.theme, ...theme.colors }
            });
        }
    }

    public isThemeActive(themeId: string): boolean {
        const theme = this.predefinedThemes.find(t => t.id === themeId);
        return theme?.colors.primaryColor === this.config().theme?.primaryColor;
    }

    constructor() {
        this.loadConfig();
    }

    private async loadConfig() {
        this.loading.set(true);
        try {
            const data: any = await firstValueFrom(this.http.get(`${environment.apiUrl}/api/restaurant`));

            // Merge with defaults to avoid null checks in template
            this.config.set({
                ...this.config(),
                ...data,
                socials: { ...this.config().socials, ...(data.socials || {}) },
                theme: { ...this.config().theme, ...(data.theme || {}) },
                billing: { ...this.config().billing, ...(data.billing || {}) }
            });

        } catch (e) {
            console.error('Error loading config', e);
            this.notify.errorKey('STORE_CONFIG.LOAD_ERROR');
        } finally {
            this.loading.set(false);
        }
    }

    public async saveConfig() {
        this.saving.set(true);
        this.message.set('');

        try {
            await firstValueFrom(this.http.patch(`${environment.apiUrl}/api/restaurant`, this.config(), {
                headers: this.auth.getHeaders()
            }));

            this.message.set(this.translate.instant('STORE_CONFIG.SAVE_SUCCESS'));
            setTimeout(() => {
                window.location.reload();
            }, 1000);

        } catch (e) {
            console.error('Error saving config', e);
            this.message.set(this.translate.instant('STORE_CONFIG.SAVE_ERROR'));
            this.notify.errorKey('STORE_CONFIG.SAVE_ERROR');
        } finally {
            this.saving.set(false);
        }
    }

    public async uploadLogo(file: File) {
        if (!file) return;
        this.saving.set(true);
        const formData = new FormData();
        formData.append('logo', file);

        try {
            const res: any = await firstValueFrom(this.http.post(`${environment.apiUrl}/api/upload-logo`, formData, {
                withCredentials: true // Ensure httpOnly cookie is sent
            }));

            this.config.set({ ...this.config(), logo: res.url });
            this.notify.successKey('STORE_CONFIG.LOGO_SUCCESS');

        } catch (e: any) {
            console.error('Error uploading logo', e);
            this.notify.errorKey('STORE_CONFIG.LOGO_ERROR');
        } finally {
            this.saving.set(false);
        }
    }

    // Helpers for binding nested objects
    updateSocial(platform: string, value: string) {
        const current = this.config();
        this.config.set({
            ...current,
            socials: { ...current.socials, [platform]: value }
        });
    }

    updateTheme(prop: string, value: string) {
        const current = this.config();
        this.config.set({
            ...current,
            theme: { ...current.theme, [prop]: value }
        });
    }

    updateBilling(prop: string, value: any) {
        const current = this.config();
        this.config.set({
            ...current,
            billing: { ...current.billing, [prop]: value }
        });
    }

    addPrinter() {
        const current = this.config();
        const newPrinter = {
            id: 'printer_' + Date.now(),
            name: 'Nueva Impresora',
            type: 'network',
            address: '192.168.1.100',
            connection: '9100'
        };
        this.config.set({
            ...current,
            printers: [...(current.printers || []), newPrinter]
        });
    }

    removePrinter(index: number) {
        const current = this.config();
        const updatedPrinters = [...(current.printers || [])];
        updatedPrinters.splice(index, 1);
        this.config.set({
            ...current,
            printers: updatedPrinters
        });
    }

    // Local Device Configuration Helpers
    public getLocalPrinterId(): string | null {
        return this.localConfig()?.printer?.id || null;
    }

    public setLocalPrinter(printerId: string) {
        const printer = this.config().printers?.find((p: any) => p.id === printerId);
        const newLocal = { ...this.localConfig(), printer };
        this.localConfig.set(newLocal);
        localStorage.setItem('disher_local_config', JSON.stringify(newLocal));
    }

    public getLocalAutoPrint(): boolean {
        return this.localConfig()?.printer?.autoPrint || false;
    }

    public setLocalAutoPrint(enabled: boolean) {
        const current = this.localConfig() || {};
        if (current.printer) {
            current.printer.autoPrint = enabled;
            this.localConfig.set({ ...current });
            localStorage.setItem('disher_local_config', JSON.stringify(current));
        }
    }
}
