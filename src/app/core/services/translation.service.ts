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
  currentLang = signal<Language>('en');

  constructor() {
    const stored = localStorage.getItem('lang') as Language;
    if (stored && (stored === 'es' || stored === 'en')) {
      this.currentLang.set(stored);
    }
  }

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
    'trans.no_data': { es: 'No hay transacciones aun.', en: 'No transactions found.' },
    'trans.edit_income': { es: 'Editar Ingreso', en: 'Edit Income' },
    'trans.edit_expense': { es: 'Editar Gasto', en: 'Edit Expense' },
    'trans.delete_title': { es: '¿Eliminar Transacción?', en: 'Delete Transaction?' },
    'trans.delete_msg': {
      es: 'Esta acción no se puede deshacer. ¿Estás seguro de que deseas eliminar este elemento?',
      en: 'This action cannot be undone. Are you sure you want to remove this item?',
    },
    'trans.cancel': { es: 'Cancelar', en: 'Cancel' },
    'trans.delete': { es: 'Eliminar', en: 'Delete' },
    'trans.actions': { es: 'Acciones', en: 'Actions' },
    'trans.edit': { es: 'Editar', en: 'Edit' },
    'trans.select_category': { es: 'Selecciona una categoría', en: 'Select a category' },
    'trans.loading_cat': { es: 'Cargando categorías...', en: 'Loading categories...' },
    'trans.prev': { es: 'Anterior', en: 'Previous' },
    'trans.next': { es: 'Siguiente', en: 'Next' },
    'trans.page': { es: 'Página', en: 'Page' },
    'trans.of': { es: 'de', en: 'of' },

    // Banks
    'banks.title': { es: 'Integración Bancaria', en: 'Bank Integration' },
    'banks.subtitle': {
      es: 'Conecta tus cuentas para sincronizar transacciones',
      en: 'Connect your bank accounts to automatically sync transactions',
    },
    'banks.connect': { es: 'Conectar', en: 'Connect' },
    'banks.premium_title': { es: 'Función Premium', en: 'Premium Feature' },
    'banks.premium_desc': {
      es: 'Desbloquea integraciones bancarias ilimitadas y sincronización automática con Spendly Premium.',
      en: 'Unlock unlimited bank integrations and automatic sync with Spendly Premium.',
    },
    'banks.premium_btn': { es: 'Obtener Premium - $4.99/mes', en: 'Get Premium - $4.99/mo' },
    'banks.restore': { es: 'Restaurar Compra', en: 'Restore Purchase' },

    'settings.security.note_title': { es: 'Nota de Seguridad', en: 'Security Note' },
    'settings.security.note_desc': {
      es: 'Por tu seguridad, cambiar la contraseña requerirá que inicies sesión nuevamente.',
      en: 'For your security, changing your password will require you to log in again.',
    },
    'settings.security.new_password': { es: 'Nueva Contraseña', en: 'New Password' },
    'settings.security.confirm_password': { es: 'Confirmar Contraseña', en: 'Confirm Password' },
    'settings.security.password_hint': {
      es: 'Debe contener al menos 8 caracteres, un número, una mayúscula y un carácter especial.',
      en: 'Must contain at least 8 characters, one number, one uppercase, one special char.',
    },
    'settings.security.mismatch': {
      es: 'Las contraseñas no coinciden',
      en: 'Passwords do not match',
    },
    'settings.security.btn_update': { es: 'Actualizar Contraseña', en: 'Update Password' },

    // Core Features
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

    // Notifications
    'notif.title': { es: 'Notificaciones', en: 'Notifications' },
    'notif.mark_read': { es: 'Marcar todo leído', en: 'Mark all read' },
    'notif.clear': { es: 'Limpiar historial', en: 'Clear history' },
    'notif.empty': { es: 'No hay notificaciones', en: 'No notifications yet' },
    'notif.update_available': { es: 'Nueva versión disponible', en: 'New version available' },
    'notif.expense_created': { es: 'Gasto creado', en: 'Expense created' },
    'notif.expense_updated': { es: 'Gasto actualizado', en: 'Expense updated' },
    'notif.expense_deleted': { es: 'Gasto eliminado', en: 'Expense deleted' },
    'notif.expense_delete_fail': { es: 'Error al eliminar gasto', en: 'Failed to delete expense' },
    'notif.income_created': { es: 'Ingreso creado', en: 'Income created' },
    'notif.income_updated': { es: 'Ingreso actualizado', en: 'Income updated' },
    'notif.income_deleted': { es: 'Ingreso eliminado', en: 'Income deleted' },
    'notif.income_delete_fail': { es: 'Error al eliminar ingreso', en: 'Failed to delete income' },
    'notif.profile_updated': {
      es: 'Perfil actualizado exitosamente!',
      en: 'Profile updated successfully!',
    },
    'notif.profile_fail': { es: 'Error al actualizar perfil', en: 'Failed to update profile' },
    'notif.password_changed': {
      es: 'Contraseña cambiada. Cerrando sesión...',
      en: 'Password changed. Logging out...',
    },
    'notif.password_fail': {
      es: 'Error al actualizar contraseña',
      en: 'Failed to update password',
    },
    'notif.account_disabled': {
      es: 'Cuenta deshabilitada. Cerrando sesión...',
      en: 'Account disabled. Logging out...',
    },
    'notif.account_fail': { es: 'Error al eliminar cuenta', en: 'Failed to delete account' },
    'notif.pending': {
      es: 'Función pendiente de implementación en el servidor.',
      en: 'Feature pending implementation on server.',
    },

    // Settings
    'settings.tabs.profile': { es: 'Perfil', en: 'Profile' },
    'settings.tabs.security': { es: 'Seguridad', en: 'Security' },
    'settings.tabs.preferences': { es: 'Preferencias', en: 'Preferences' },

    'settings.profile.title': { es: 'Cuenta Personal', en: 'Personal Account' },
    'settings.profile.name': { es: 'Nombre Completo', en: 'Full Name' },
    'settings.profile.email': { es: 'Correo Electrónico', en: 'Email Address' },
    'settings.profile.username': { es: 'Nombre de Usuario', en: 'Username' },
    'settings.profile.save': { es: 'Guardar Cambios', en: 'Save Changes' },

    'settings.pref.dark_mode': { es: 'Modo Oscuro', en: 'Dark Mode' },
    'settings.pref.dark_desc': {
      es: 'Reduce la fatiga visual en poca luz',
      en: 'Reduce eye strain in low light',
    },
    'settings.pref.lang': { es: 'Idioma', en: 'Language' },
    'settings.pref.lang_desc': {
      es: 'Cambiar idioma de la aplicación',
      en: 'Change application language',
    },

    'settings.danger.title': { es: 'Zona de Peligro', en: 'Danger Zone' },
    'settings.danger.desc': {
      es: 'Eliminar permanentemente tu cuenta y datos.',
      en: 'Permanently delete your account and all data.',
    },
    'settings.danger.btn': { es: 'Eliminar Cuenta', en: 'Delete Account' },
    // Categories (Normalized keys: cat.{lowercase_name})
    'cat.food': { es: 'Comida', en: 'Food' },
    'cat.comida': { es: 'Comida', en: 'Food' },

    'cat.transport': { es: 'Transporte', en: 'Transport' },
    'cat.transporte': { es: 'Transporte', en: 'Transport' },

    'cat.housing': { es: 'Vivienda', en: 'Housing' },
    'cat.vivienda': { es: 'Vivienda', en: 'Housing' },

    'cat.utilities': { es: 'Servicios', en: 'Utilities' },
    'cat.servicios': { es: 'Servicios', en: 'Utilities' },

    'cat.entertainment': { es: 'Entretenimiento', en: 'Entertainment' },
    'cat.entretenimiento': { es: 'Entretenimiento', en: 'Entertainment' },

    'cat.shopping': { es: 'Compras', en: 'Shopping' },
    'cat.compras': { es: 'Compras', en: 'Shopping' },

    'cat.health': { es: 'Salud', en: 'Health' },
    'cat.salud': { es: 'Salud', en: 'Health' },

    'cat.education': { es: 'Educación', en: 'Education' },
    'cat.educacion': { es: 'Educación', en: 'Education' },
    'cat.educación': { es: 'Educación', en: 'Education' },

    'cat.groceries': { es: 'Supermercado', en: 'Groceries' },
    'cat.supermercado': { es: 'Supermercado', en: 'Groceries' },

    'cat.other': { es: 'Otros', en: 'Other' },
    'cat.otros': { es: 'Otros', en: 'Other' },

    'cat.salary': { es: 'Salario', en: 'Salary' },
    'cat.salario': { es: 'Salario', en: 'Salary' },

    'cat.investment': { es: 'Inversión', en: 'Investment' },
    'cat.inversion': { es: 'Inversión', en: 'Investment' },
    'cat.inversión': { es: 'Inversión', en: 'Investment' },
    'cat.inversiones': { es: 'Inversiones', en: 'Investments' }, // From SQL

    'cat.freelance': { es: 'Freelance', en: 'Freelance' },

    // New missing categories from SQL
    // 'cat.servicios' is already mapped above to Utilities
    'cat.deudas': { es: 'Deudas', en: 'Debts' },
    'cat.mascotas': { es: 'Mascotas', en: 'Pets' },
    'cat.regalos': { es: 'Regalos', en: 'Gifts' },
    'cat.gasolina': { es: 'Gasolina', en: 'Gas' },
    'cat.cuidado_personal': { es: 'Cuidado Personal', en: 'Personal Care' },
    'cat.viajes': { es: 'Viajes', en: 'Travel' },
    'cat.farmacia': { es: 'Farmacia', en: 'Pharmacy' },
    'cat.mantenimiento': { es: 'Mantenimiento', en: 'Maintenance' },
    'cat.vida_social': { es: 'Vida Social', en: 'Social Life' },
    'cat.alimentacion': { es: 'Alimentación', en: 'Food' },

    'cat.general': { es: 'General', en: 'General' },
  };

  /**
   * Get translation for a key
   */
  translate(key: string): string {
    const term = this.dictionary[key];
    if (!term) return key; // Fallback to key if not found
    return term[this.currentLang()];
  }

  translateCategory(categoryName: string): string {
    if (!categoryName) return '';
    const key = 'cat.' + categoryName.toLowerCase().replace(/ /g, '_');
    const term = this.dictionary[key];
    return term ? term[this.currentLang()] : categoryName;
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
        // Special check for dynamic category keys to avoid spamming warn if not found
        if (key.startsWith('cat.')) return key.replace('cat.', '');

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
      this.currentLang.update((l) => {
        const newLang = l === 'es' ? 'en' : 'es';
        localStorage.setItem('lang', newLang);
        return newLang;
      });
      setTimeout(() => {
        this.isTransitioning.set(false);
      }, 150); // Faster transition
    }, 150); // Faster transition
  }

  setLang(lang: Language) {
    this.currentLang.set(lang);
    localStorage.setItem('lang', lang);
  }
}
