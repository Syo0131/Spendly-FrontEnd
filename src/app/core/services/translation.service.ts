import { Injectable, signal, computed } from '@angular/core';

export type Language = 'es' | 'en';

type Translations = {
  [key: string]: {
    [lang in Language]: string;
  };
};

@Injectable({
  providedIn: 'root',
})
export class TranslationService {
  currentLang = signal<Language>('es');

  private dictionary: Translations = {
    // Auth
    'auth.welcome': { es: 'Bienvenido de nuevo', en: 'Welcome Back' },
    'auth.subtitle': {
      es: 'Inicia sesión para gestionar tus gastos',
      en: 'Sign in to manage your expenses',
    },
    'auth.username': { es: 'Usuario', en: 'Username' },
    'auth.password': { es: 'Contraseña', en: 'Password' },
    'auth.login': { es: 'Iniciar Sesión', en: 'Sign in' },
    'auth.login.loading': { es: 'Iniciando...', en: 'Signing in...' },
    'auth.no_account': { es: '¿No tienes cuenta?', en: "Don't have an account?" },
    'auth.signup': { es: 'Registrarse', en: 'Sign up' },
    'auth.create_account': { es: 'Crear Cuenta', en: 'Create Account' },
    'auth.join': {
      es: 'Únete a Spendly para controlar tus finanzas',
      en: 'Join Spendly to control your finances',
    },
    'auth.name': { es: 'Nombre', en: 'Name' },
    'auth.email': { es: 'Correo', en: 'Email' },
    'auth.creating': { es: 'Creando cuenta...', en: 'Creating account...' },
    'auth.have_account': { es: '¿Ya tienes cuenta?', en: 'Already have an account?' },

    // Dashboard
    'dash.title': { es: 'Inicio', en: 'Dashboard' },
    'dash.welcome': { es: 'Bienvenido de nuevo', en: 'Welcome back' },
    'dash.balance': { es: 'Balance Total', en: 'Total Balance' },
    'dash.income': { es: 'Ingresos del Mes', en: 'Monthly Income' },
    'dash.expenses': { es: 'Gastos del Mes', en: 'Monthly Expenses' },
    'dash.breakdown': { es: 'Desglose de Gastos', en: 'Expense Breakdown' },
    'dash.overview': { es: 'Resumen Financiero', en: 'Financial Overview' },

    // Navigation
    'nav.dashboard': { es: 'Inicio', en: 'Dashboard' },
    'nav.incomes': { es: 'Ingresos', en: 'Incomes' },
    'nav.expenses': { es: 'Gastos', en: 'Expenses' },
    'nav.budgets': { es: 'Presupuestos', en: 'Budgets' },
    'nav.menu': { es: 'Menú', en: 'Menu' },
    'nav.goals': { es: 'Metas Ahorro', en: 'Savings Goals' },
    'nav.reminders': { es: 'Recordatorios', en: 'Reminders' },
    'nav.recurring': { es: 'Recurrentes', en: 'Recurring' },
    'nav.banks': { es: 'Bancos', en: 'Banks' },
    'nav.settings': { es: 'Ajustes', en: 'Settings' },
    'nav.logout': { es: 'Cerrar Sesión', en: 'Logout' },

    // Transactions
    'trans.add_income': { es: 'Agregar Ingreso', en: 'Add Income' },
    'trans.add_expense': { es: 'Agregar Gasto', en: 'Add Expense' },
    'trans.desc': { es: 'Descripción', en: 'Description' },
    'trans.amount': { es: 'Monto', en: 'Amount' },
    'trans.date': { es: 'Fecha', en: 'Date' },
    'trans.category': { es: 'Categoría', en: 'Category' },
    'trans.save': { es: 'Guardar', en: 'Save' },
    'trans.loading_cat': { es: 'Cargando categorías...', en: 'Loading categories...' },
    'trans.no_data': { es: 'No hay transacciones aun.', en: 'No transactions found.' },

    // Banks
    'banks.title': { es: 'Integración Bancaria', en: 'Bank Integration' },
    'banks.subtitle': {
      es: 'Conecta tus cuentas para sincronizar transacciones',
      en: 'Connect your bank accounts to automatically sync transactions',
    },
    'banks.connect': { es: 'Conectar', en: 'Connect' },

    // New Feature Placeholders
    'budgets.title': { es: 'Presupuestos', en: 'Budgets' },
    'budgets.desc': {
      es: '¡Gestión de presupuestos pronto!',
      en: 'Budget management coming soon!',
    },
    'goals.title': { es: 'Metas de Ahorro', en: 'Savings Goals' },
    'goals.desc': {
      es: '¡Establece y sigue tus metas de ahorro pronto!',
      en: 'Set and track your savings goals soon!',
    },
    'reminders.title': { es: 'Recordatorios', en: 'Reminders' },
    'reminders.desc': {
      es: '¡Recordatorios de facturas y alertas pronto!',
      en: 'Bill reminders and alerts coming soon!',
    },
    'recurring.title': { es: 'Gastos Recurrentes', en: 'Recurring Expenses' },
    'recurring.desc': {
      es: '¡Administra suscripciones y facturas recurrentes pronto!',
      en: 'Manage subscriptions and recurring bills soon!',
    },
  };

  /**
   * Get translation for a key
   */
  translate(key: string): string {
    const term = this.dictionary[key];
    if (!term) return key; // Fallback to key if not found
    return term[this.currentLang()];
  }

  /**
   * Helper signal to use in templates efficiently.
   * We explicitly depend on currentLang to ensure reactivity.
   */
  t = computed(() => {
    const lang = this.currentLang(); // Dependency
    return (key: string) => {
      const term = this.dictionary[key];
      if (!term) {
        console.warn(`Missing translation for key: ${key}`);
        return key;
      }
      return term[lang] || key;
    };
  });

  isTransitioning = signal(false);

  toggleLang() {
    this.isTransitioning.set(true);
    setTimeout(() => {
      this.currentLang.update((l) => (l === 'es' ? 'en' : 'es'));
      setTimeout(() => {
        this.isTransitioning.set(false);
      }, 150); // Faster transition
    }, 150); // Faster transition
  }

  setLang(lang: Language) {
    this.currentLang.set(lang);
  }
}
