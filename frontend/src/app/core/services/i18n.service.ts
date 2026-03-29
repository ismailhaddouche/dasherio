import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { Platform } from '@angular/cdk/platform';
import { HttpClient } from '@angular/common/http';
import { authStore, type Language } from '../../store/auth.store';

export type { Language };
import { environment } from '../../../environments/environment';

interface Translations {
  [key: string]: string | Translations;
}

const TRANSLATIONS: Record<Language, Translations> = {
  es: {
    // Common
    'common.loading': 'Cargando...',
    'common.logging_in': 'Accediendo...',
    'common.save': 'Guardar',
    'common.cancel': 'Cancelar',
    'common.delete': 'Eliminar',
    'common.edit': 'Editar',
    'common.create': 'Crear',
    'common.search': 'Buscar',
    'common.filter': 'Filtrar',
    'common.close': 'Cerrar',
    'common.back': 'Volver',
    'common.next': 'Siguiente',
    'common.previous': 'Anterior',
    'common.confirm': 'Confirmar',
    'common.yes': 'Sí',
    'common.no': 'No',
    'common.active': 'Activo',
    'common.inactive': 'Inactivo',
    'common.error': 'Error',
    'common.success': 'Éxito',
    'common.warning': 'Advertencia',
    'common.info': 'Información',
    'common.refresh': 'Actualizar',
    'common.logout': 'Cerrar sesión',
    'common.settings': 'Configuración',
    'common.profile': 'Perfil',
    'common.language': 'Idioma',
    'common.theme': 'Tema',
    'common.dark': 'Oscuro',
    'common.light': 'Claro',
    'common.system': 'Sistema',
    'common.default': 'Por defecto',
    'common.from': 'Desde',
    'common.to': 'Hasta',

    // Auth
    'auth.login': 'Iniciar sesión',
    'auth.login.username': 'Usuario',
    'auth.login.password': 'Contraseña',
    'auth.login.pin': 'PIN',
    'auth.login.submit': 'Entrar',
    'auth.login.error': 'Error al iniciar sesión',
    'auth.login.success': 'Sesión iniciada correctamente',

    // Dashboard
    'dashboard.title': 'Panel de Control',
    'dashboard.stats.today': 'Hoy',
    'dashboard.stats.week': 'Esta semana',
    'dashboard.stats.month': 'Este mes',
    'dashboard.stats.revenue': 'Ingresos',
    'dashboard.stats.orders': 'Pedidos',
    'dashboard.stats.customers': 'Clientes',
    'dashboard.stats.avgTicket': 'Ticket promedio',
    'dashboard.chart.sales': 'Ventas',
    'dashboard.chart.orders': 'Pedidos',
    'dashboard.recentOrders': 'Pedidos recientes',
    'dashboard.popularDishes': 'Platos populares',
    'dashboard.loading': 'Cargando datos del panel...',
    'dashboard.error': 'Error al cargar los datos del panel',

    // Admin
    'admin.title': 'Administración',
    'admin.menu.dashboard': 'Dashboard',
    'admin.menu.orders': 'Pedidos',
    'admin.menu.dishes': 'Carta',
    'admin.menu.categories': 'Categorías',
    'admin.menu.staff': 'Personal',
    'admin.menu.totems': 'Tótems',
    'admin.menu.logs': 'Logs',
    'admin.menu.settings': 'Ajustes',
    'admin.menu.reports': 'Informes',

    // Dish
    'dish.new_dish': 'Nuevo Plato',
    'dish.no_description': 'Sin descripción',
    'dish.no_dishes': 'No hay platos creados aún',
    'dish.toggle_status_error': 'Error al cambiar el estado del plato',

    // TAS (Table Assistance)
    'tas.title': 'Servicio de Mesas',
    'tas.tables': 'Mesas',
    'tas.tables.free': 'Libre',
    'tas.tables.occupied': 'Ocupada',
    'tas.tables.reserved': 'Reservada',
    'tas.session.open': 'Abrir sesión',
    'tas.session.close': 'Cerrar sesión',
    'tas.session.customers': 'Clientes',
    'tas.order.add': 'Añadir pedido',
    'tas.order.send': 'Enviar a cocina',
    'tas.order.pay': 'Pagar',

    // POS
    'pos.title': 'Punto de Venta',
    'pos.tables': 'Mesas',
    'pos.no_active_sessions': 'Sin sesiones activas',
    'pos.new_table': 'Nueva Mesa',
    'pos.select_table': 'Selecciona una mesa para ver los pedidos',
    'pos.ticket': 'Ticket',
    'pos.empty_cart': 'Carrito vacío',
    'pos.checkout': 'Cobrar',
    'pos.charge': 'Cobrar',
    'pos.total': 'Total',
    'pos.subtotal': 'Subtotal (sin IVA)',
    'pos.tax': 'IVA',
    'pos.discount': 'Descuento',
    'pos.tip': 'Propina',

    // KDS
    'kds.title': 'Pantalla de Cocina',
    'kds.pending': 'pendientes',
    'kds.new_orders': 'Nuevos',
    'kds.prepare': 'Preparar',
    'kds.in_preparation': 'En preparación',
    'kds.serve': 'Servido',
    'kds.preparing': 'Preparando',
    'kds.ready': 'Listo',
    'kds.served': 'Servido',

    // Errors (error.* for general, errors.* for API codes)
    'error.loading': 'Error al cargar los datos',
    'error.saving': 'Error al guardar los cambios',
    'error.deleting': 'Error al eliminar',
    'error.network': 'Error de conexión',
    'error.unauthorized': 'Sesión expirada. Por favor, inicie sesión de nuevo.',
    'error.forbidden': 'No tiene permisos para realizar esta acción',
    'error.notFound': 'No se encontró el recurso solicitado',
    'error.server': 'Error del servidor. Inténtelo de nuevo más tarde.',
    'errors.INVALID_CREDENTIALS': 'Credenciales incorrectas',
    'errors.LOADING_ERROR': 'Error al cargar. Inténtalo de nuevo.',
    'errors.SERVER_ERROR': 'Error interno del servidor',

    // Settings
    'settings.title': 'Configuración',
    'settings.general': 'General',
    'settings.restaurant': 'Restaurante',
    'settings.tax': 'Impuestos',
    'settings.currency': 'Moneda',
    'settings.language': 'Idioma',
    'settings.theme': 'Tema',
    'settings.preferences.saved': 'Preferencias guardadas correctamente',
    'settings.preferences.error': 'Error al guardar preferencias',
  },
  en: {
    // Common
    'common.loading': 'Loading...',
    'common.logging_in': 'Signing in...',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.create': 'Create',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.close': 'Close',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.confirm': 'Confirm',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.active': 'Active',
    'common.inactive': 'Inactive',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.warning': 'Warning',
    'common.info': 'Information',
    'common.refresh': 'Refresh',
    'common.logout': 'Logout',
    'common.settings': 'Settings',
    'common.profile': 'Profile',
    'common.language': 'Language',
    'common.theme': 'Theme',
    'common.dark': 'Dark',
    'common.light': 'Light',
    'common.system': 'System',
    'common.default': 'Default',
    'common.from': 'From',
    'common.to': 'To',

    // Auth
    'auth.login': 'Login',
    'auth.login.username': 'Username',
    'auth.login.password': 'Password',
    'auth.login.pin': 'PIN',
    'auth.login.submit': 'Sign In',
    'auth.login.error': 'Login error',
    'auth.login.success': 'Login successful',

    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.stats.today': 'Today',
    'dashboard.stats.week': 'This week',
    'dashboard.stats.month': 'This month',
    'dashboard.stats.revenue': 'Revenue',
    'dashboard.stats.orders': 'Orders',
    'dashboard.stats.customers': 'Customers',
    'dashboard.stats.avgTicket': 'Avg Ticket',
    'dashboard.chart.sales': 'Sales',
    'dashboard.chart.orders': 'Orders',
    'dashboard.recentOrders': 'Recent Orders',
    'dashboard.popularDishes': 'Popular Dishes',
    'dashboard.loading': 'Loading dashboard data...',
    'dashboard.error': 'Error loading dashboard data',

    // Admin
    'admin.title': 'Administration',
    'admin.menu.dashboard': 'Dashboard',
    'admin.menu.orders': 'Orders',
    'admin.menu.dishes': 'Menu',
    'admin.menu.categories': 'Categories',
    'admin.menu.staff': 'Staff',
    'admin.menu.totems': 'Totems',
    'admin.menu.logs': 'Logs',
    'admin.menu.settings': 'Settings',
    'admin.menu.reports': 'Reports',

    // Dish
    'dish.new_dish': 'New Dish',
    'dish.no_description': 'No description',
    'dish.no_dishes': 'No dishes created yet',
    'dish.toggle_status_error': 'Error changing dish status',

    // TAS (Table Assistance)
    'tas.title': 'Table Service',
    'tas.tables': 'Tables',
    'tas.tables.free': 'Free',
    'tas.tables.occupied': 'Occupied',
    'tas.tables.reserved': 'Reserved',
    'tas.session.open': 'Open Session',
    'tas.session.close': 'Close Session',
    'tas.session.customers': 'Customers',
    'tas.order.add': 'Add Order',
    'tas.order.send': 'Send to Kitchen',
    'tas.order.pay': 'Pay',

    // POS
    'pos.title': 'Point of Sale',
    'pos.tables': 'Tables',
    'pos.no_active_sessions': 'No active sessions',
    'pos.new_table': 'New Table',
    'pos.select_table': 'Select a table to view orders',
    'pos.ticket': 'Ticket',
    'pos.empty_cart': 'Empty cart',
    'pos.checkout': 'Checkout',
    'pos.charge': 'Charge',
    'pos.total': 'Total',
    'pos.subtotal': 'Subtotal (excl. tax)',
    'pos.tax': 'Tax',
    'pos.discount': 'Discount',
    'pos.tip': 'Tip',

    // KDS
    'kds.title': 'Kitchen Display',
    'kds.pending': 'pending',
    'kds.new_orders': 'New',
    'kds.prepare': 'Prepare',
    'kds.in_preparation': 'In preparation',
    'kds.serve': 'Served',
    'kds.preparing': 'Preparing',
    'kds.ready': 'Ready',
    'kds.served': 'Served',

    // Errors (error.* for general, errors.* for API codes)
    'error.loading': 'Error loading data',
    'error.saving': 'Error saving changes',
    'error.deleting': 'Error deleting',
    'error.network': 'Network error',
    'error.unauthorized': 'Session expired. Please log in again.',
    'error.forbidden': 'You do not have permission to perform this action',
    'error.notFound': 'Requested resource not found',
    'error.server': 'Server error. Please try again later.',
    'errors.INVALID_CREDENTIALS': 'Invalid credentials',
    'errors.LOADING_ERROR': 'Loading error. Please try again.',
    'errors.SERVER_ERROR': 'Internal server error',

    // Settings
    'settings.title': 'Settings',
    'settings.general': 'General',
    'settings.restaurant': 'Restaurant',
    'settings.tax': 'Tax',
    'settings.currency': 'Currency',
    'settings.language': 'Language',
    'settings.theme': 'Theme',
    'settings.preferences.saved': 'Preferences saved successfully',
    'settings.preferences.error': 'Error saving preferences',
  },
  fr: {
    // Common
    'common.loading': 'Chargement...',
    'common.logging_in': 'Connexion...',
    'common.save': 'Enregistrer',
    'common.cancel': 'Annuler',
    'common.delete': 'Supprimer',
    'common.edit': 'Modifier',
    'common.create': 'Créer',
    'common.search': 'Rechercher',
    'common.filter': 'Filtrer',
    'common.close': 'Fermer',
    'common.back': 'Retour',
    'common.next': 'Suivant',
    'common.previous': 'Précédent',
    'common.confirm': 'Confirmer',
    'common.yes': 'Oui',
    'common.no': 'Non',
    'common.active': 'Actif',
    'common.inactive': 'Inactif',
    'common.error': 'Erreur',
    'common.success': 'Succès',
    'common.warning': 'Attention',
    'common.info': 'Information',
    'common.refresh': 'Actualiser',
    'common.logout': 'Déconnexion',
    'common.settings': 'Paramètres',
    'common.profile': 'Profil',
    'common.language': 'Langue',
    'common.theme': 'Thème',
    'common.dark': 'Sombre',
    'common.light': 'Clair',
    'common.system': 'Système',
    'common.default': 'Par défaut',
    'common.from': 'De',
    'common.to': 'À',

    // Auth
    'auth.login': 'Connexion',
    'auth.login.username': "Nom d'utilisateur",
    'auth.login.password': 'Mot de passe',
    'auth.login.pin': 'PIN',
    'auth.login.submit': 'Se connecter',
    'auth.login.error': 'Erreur de connexion',
    'auth.login.success': 'Connexion réussie',

    // Dashboard
    'dashboard.title': 'Tableau de bord',
    'dashboard.stats.today': "Aujourd'hui",
    'dashboard.stats.week': 'Cette semaine',
    'dashboard.stats.month': 'Ce mois-ci',
    'dashboard.stats.revenue': 'Revenus',
    'dashboard.stats.orders': 'Commandes',
    'dashboard.stats.customers': 'Clients',
    'dashboard.stats.avgTicket': 'Ticket moyen',
    'dashboard.chart.sales': 'Ventes',
    'dashboard.chart.orders': 'Commandes',
    'dashboard.recentOrders': 'Commandes récentes',
    'dashboard.popularDishes': 'Plats populaires',
    'dashboard.loading': 'Chargement du tableau de bord...',
    'dashboard.error': 'Erreur lors du chargement du tableau de bord',

    // Admin
    'admin.title': 'Administration',
    'admin.menu.dashboard': 'Tableau de bord',
    'admin.menu.orders': 'Commandes',
    'admin.menu.dishes': 'Carte',
    'admin.menu.categories': 'Catégories',
    'admin.menu.staff': 'Personnel',
    'admin.menu.totems': 'Totems',
    'admin.menu.logs': 'Logs',
    'admin.menu.settings': 'Paramètres',
    'admin.menu.reports': 'Rapports',

    // Dish
    'dish.new_dish': 'Nouveau Plat',
    'dish.no_description': 'Sans description',
    'dish.no_dishes': 'Aucun plat créé',
    'dish.toggle_status_error': 'Erreur lors du changement de statut du plat',

    // TAS (Table Assistance)
    'tas.title': 'Service de table',
    'tas.tables': 'Tables',
    'tas.tables.free': 'Libre',
    'tas.tables.occupied': 'Occupée',
    'tas.tables.reserved': 'Réservée',
    'tas.session.open': 'Ouvrir session',
    'tas.session.close': 'Fermer session',
    'tas.session.customers': 'Clients',
    'tas.order.add': 'Ajouter commande',
    'tas.order.send': 'Envoyer en cuisine',
    'tas.order.pay': 'Payer',

    // POS
    'pos.title': 'Point de vente',
    'pos.tables': 'Tables',
    'pos.no_active_sessions': 'Aucune session active',
    'pos.new_table': 'Nouvelle Table',
    'pos.select_table': 'Sélectionnez une table pour voir les commandes',
    'pos.ticket': 'Ticket',
    'pos.empty_cart': 'Panier vide',
    'pos.checkout': 'Caisse',
    'pos.charge': 'Encaisser',
    'pos.total': 'Total',
    'pos.subtotal': 'Sous-total (HT)',
    'pos.tax': 'TVA',
    'pos.discount': 'Réduction',
    'pos.tip': 'Pourboire',

    // KDS
    'kds.title': 'Écran cuisine',
    'kds.pending': 'en attente',
    'kds.new_orders': 'Nouveaux',
    'kds.prepare': 'Préparer',
    'kds.in_preparation': 'En préparation',
    'kds.serve': 'Servi',
    'kds.preparing': 'En préparation',
    'kds.ready': 'Prêt',
    'kds.served': 'Servi',

    // Errors (error.* for general, errors.* for API codes)
    'error.loading': 'Erreur lors du chargement des données',
    'error.saving': "Erreur lors de l'enregistrement des modifications",
    'error.deleting': 'Erreur lors de la suppression',
    'error.network': 'Erreur de connexion',
    'error.unauthorized': 'Session expirée. Veuillez vous reconnecter.',
    'error.forbidden': "Vous n'avez pas la permission d'effectuer cette action",
    'error.notFound': 'Ressource demandée non trouvée',
    'error.server': 'Erreur serveur. Veuillez réessayer plus tard.',
    'errors.INVALID_CREDENTIALS': 'Identifiants invalides',
    'errors.LOADING_ERROR': 'Erreur de chargement. Veuillez réessayer.',
    'errors.SERVER_ERROR': 'Erreur interne du serveur',

    // Settings
    'settings.title': 'Paramètres',
    'settings.general': 'Général',
    'settings.restaurant': 'Restaurant',
    'settings.tax': 'Taxes',
    'settings.currency': 'Devise',
    'settings.language': 'Langue',
    'settings.theme': 'Thème',
    'settings.preferences.saved': 'Préférences enregistrées avec succès',
    'settings.preferences.error': 'Erreur lors de la sauvegarde des préférences',
  }
};

@Injectable({
  providedIn: 'root'
})
export class I18nService {
  private readonly platform = inject(Platform);
  private readonly http = inject(HttpClient);
  
  // Signals
  private readonly _currentLang = signal<Language>('es');
  readonly currentLang = this._currentLang.asReadonly();
  
  readonly isSpanish = computed(() => this._currentLang() === 'es');
  readonly isEnglish = computed(() => this._currentLang() === 'en');
  readonly isFrench = computed(() => this._currentLang() === 'fr');
  
  constructor() {
    // Load language from user preferences or localStorage
    this.loadLanguage();
    
    // Watch for changes in auth store preferences
    effect(() => {
      const prefs = authStore.preferences();
      if (prefs?.language) {
        this._currentLang.set(prefs.language);
      }
    });
    
    // Save language when it changes
    effect(() => {
      const lang = this._currentLang();
      if (this.platform.isBrowser) {
        localStorage.setItem('disherio-language', lang);
        document.documentElement.lang = lang;
      }
    });
  }
  
  private loadLanguage(): void {
    // Priority: 1. Auth store preferences, 2. localStorage, 3. Browser language, 4. Default 'es'
    const userPrefs = authStore.preferences();
    if (userPrefs?.language) {
      this._currentLang.set(userPrefs.language);
      return;
    }
    
    if (this.platform.isBrowser) {
      const saved = localStorage.getItem('disherio-language') as Language;
      if (saved && TRANSLATIONS[saved]) {
        this._currentLang.set(saved);
        return;
      }
      
      // Detect browser language
      const browserLang = navigator.language.split('-')[0] as Language;
      if (TRANSLATIONS[browserLang]) {
        this._currentLang.set(browserLang);
        return;
      }
    }
    
    this._currentLang.set('es');
  }
  
  setLanguage(lang: Language): void {
    if (!TRANSLATIONS[lang]) return;
    
    this._currentLang.set(lang);
    
    // Save to backend
    this.savePreference('language', lang);
    
    // Update local auth store
    authStore.updatePreferences({ language: lang });
  }
  
  private savePreference(key: 'language' | 'theme', value: string): void {
    if (!authStore.isAuthenticated()) return;
    
    this.http.patch(`${environment.apiUrl}/staff/me/preferences`, { [key]: value })
      .subscribe({
        error: (err) => console.error('Failed to save preference:', err)
      });
  }
  
  translate(key: string): string {
    const translations = TRANSLATIONS[this._currentLang()];

    // TRANSLATIONS stores flat keys like 'dashboard.title' as literal strings —
    // try direct lookup first before attempting dot-navigation.
    const direct = translations[key];
    if (typeof direct === 'string') {
      return direct;
    }

    // Fallback: navigate nested objects for any future nested structure
    const parts = key.split('.');
    let value: unknown = translations;
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = (value as Translations)[part];
      } else {
        return key;
      }
    }
    return typeof value === 'string' ? value : key;
  }
  
  // Get all available languages
  getAvailableLanguages(): { code: Language; name: string; flag: string }[] {
    return [
      { code: 'es', name: 'Español', flag: '🇪🇸' },
      { code: 'en', name: 'English', flag: '🇬🇧' },
      { code: 'fr', name: 'Français', flag: '🇫🇷' }
    ];
  }
}
