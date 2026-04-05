import { ApplicationConfig, provideBrowserGlobalErrorListeners, ErrorHandler, isDevMode } from '@angular/core';
import { provideServiceWorker } from '@angular/service-worker';
import { provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
import { errorInterceptor } from './interceptors/error.interceptor';
import { GlobalErrorHandler } from './services/global-error.handler';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Configuración de router con lazy loading y preloading strategy
    // PreloadAllModules: Carga todos los módulos lazy después de la carga inicial
    provideRouter(routes, withPreloading(PreloadAllModules)),
    // Registrar interceptores en orden: JWT primero, luego manejo de errores
    provideHttpClient(withInterceptors([jwtInterceptor, errorInterceptor])),
    provideAnimations(),
    // Configurar manejador global de errores
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    // Registrar Service Worker para actualizaciones de aplicación
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
