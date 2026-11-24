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
    'dashboard.spending_title': { es: 'Gastos de {{month}}', en: '{{month}} expenses' },
    'dashboard.cat_of_limit': { es: 'de {{amount}}', en: 'of {{amount}}' },
    'dashboard.cat_of_limit_year': { es: 'de {{amount}} este año', en: 'of {{amount}} this year' },
    'dashboard.cat_share': { es: '{{pct}}% del total', en: '{{pct}}% of total' },
    'dashboard.no_budgets_hint': {
      es: 'Crea presupuestos para ver cómo vas en cada categoría',
      en: "Create budgets to see how you're doing in each category",
    },
    'dashboard.no_expenses_title': { es: 'Sin gastos este mes', en: 'No expenses this month' },

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
    'trans.title': { es: 'Título', en: 'Title' },
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
    'trans.incomes_subtitle': { es: 'Administra tus fuentes de ingreso', en: 'Manage your sources of income' },
    'trans.empty_incomes_title': { es: 'Sin ingresos registrados', en: 'No incomes recorded' },
    'trans.empty_incomes_desc': {
      es: 'Comienza agregando un ingreso para llevar el control de tus finanzas.',
      en: 'Start by adding an income to track your finances.',
    },
    'trans.expenses_subtitle': { es: 'Controla y monitorea tus gastos', en: 'Track your spending habits' },
    'trans.all_time': { es: 'Todo el tiempo', en: 'All Time' },
    'trans.all_categories': { es: 'Todas las categorías', en: 'All Categories' },
    'trans.general': { es: 'General', en: 'General' },
    'trans.update': { es: 'Actualizar', en: 'Update' },
    'trans.empty_expenses_title': { es: 'Sin gastos registrados', en: 'No expenses recorded' },
    'trans.empty_expenses_desc': {
      es: 'Comienza agregando un gasto para llevar el control de tus finanzas.',
      en: 'Start by adding an expense to track your finances.',
    },

    // Banks
    'banks.title': { es: 'Integración Bancaria', en: 'Bank Integration' },
    'banks.subtitle': {
      es: 'Conecta tus cuentas para sincronizar transacciones',
      en: 'Connect your bank accounts to automatically sync transactions',
    },
    'banks.connect': { es: 'Conectar', en: 'Connect' },
    'banks.premium_title': { es: 'Próximamente', en: 'Coming Soon' },
    'banks.premium_desc': {
      es: 'Estamos trabajando en integraciones bancarias automáticas. ¡Muy pronto!',
      en: 'We are working on automatic bank integrations. Coming very soon!',
    },
    'banks.premium_btn': { es: 'Notificarme', en: 'Notify Me' },
    'banks.restore': { es: 'Restaurar Compra', en: 'Restore Purchase' },
    'banks.unexpected_response': {
      es: 'Respuesta inesperada del servidor.',
      en: 'Unexpected response from server.',
    },
    'banks.connect_failed': {
      es: 'No se pudo conectar el banco. Inténtalo de nuevo.',
      en: 'Failed to connect to bank. Please try again.',
    },
    'banks.disconnect_failed': {
      es: 'No se pudo desconectar el banco.',
      en: 'Failed to disconnect bank.',
    },

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
    'budgets.subtitle': {
      es: 'Administra tus límites de gasto -',
      en: 'Manage your spending limits -',
    },
    'budgets.create': { es: 'Crear Presupuesto', en: 'Create Budget' },
    'budgets.total_budgeted': { es: 'Total Presupuestado', en: 'Total Budgeted' },
    'budgets.total_spent': { es: 'Total Gastado', en: 'Total Spent' },
    'budgets.remaining': { es: 'Restante', en: 'Remaining' },
    'budgets.left': { es: 'disponible', en: 'left' },
    'budgets.spent': { es: 'Gastado', en: 'Spent' },
    'budgets.limit': { es: 'Límite', en: 'Limit' },
    'budgets.create_new': { es: 'Crear Nuevo', en: 'Create New' },
    'budgets.edit': { es: 'Editar Presupuesto', en: 'Edit Budget' },
    'budgets.desc': {
      es: '¡Gestión de presupuestos pronto!',
      en: 'Budget management coming soon!',
    },
    'budgets.period': { es: 'Período', en: 'Period' },
    'budgets.period_monthly': { es: 'Mensual', en: 'Monthly' },
    'budgets.period_yearly': { es: 'Anual', en: 'Yearly' },
    'budgets.updated': { es: 'Presupuesto actualizado', en: 'Budget updated successfully' },
    'budgets.update_failed': {
      es: 'No se pudo actualizar el presupuesto',
      en: 'Failed to update budget',
    },
    'budgets.created': { es: 'Presupuesto creado', en: 'Budget created successfully' },
    'budgets.create_failed': { es: 'No se pudo crear el presupuesto', en: 'Failed to create budget' },
    'budgets.deleted': { es: 'Presupuesto eliminado', en: 'Budget deleted' },
    'budgets.delete_failed': {
      es: 'No se pudo eliminar el presupuesto',
      en: 'Failed to delete budget',
    },
    'budgets.advanced_options': { es: 'Opciones Avanzadas', en: 'Advanced Options' },
    'budgets.recurring_title': { es: 'Presupuesto Recurrente', en: 'Recurring Budget' },
    'budgets.recurring_desc': {
      es: 'Renovar automáticamente cada mes',
      en: 'Automatically renew every month',
    },
    'budgets.warning_threshold': { es: 'Umbral de Advertencia (%)', en: 'Warning Threshold (%)' },
    'budgets.critical_threshold': { es: 'Umbral Crítico (%)', en: 'Critical Threshold (%)' },
    'budgets.repeat_duration': { es: 'Duración (Meses)', en: 'Repeat Duration (Months)' },
    'budgets.notify_help': {
      es: 'Notificar cuando el gasto supere este %',
      en: 'Notify when spent exceeds this %',
    },
    'budgets.error_category': { es: 'La categoría es requerida', en: 'Category is required' },
    'budgets.error_amount': { es: 'Monto válido requerido', en: 'Valid amount required' },
    'budgets.update': { es: 'Actualizar Presupuesto', en: 'Update Budget' },
    'budgets.create_btn': { es: 'Crear Presupuesto', en: 'Create Budget' },
    'budgets.create_new_desc': {
      es: 'Establecer límites para otra categoría',
      en: 'Set limits for another category',
    },
    'budgets.no_budgets': {
      es: 'No hay presupuestos para este mes.',
      en: 'No budgets set for this month.',
    },
    'budgets.add': { es: 'Nuevo Presupuesto', en: 'New Budget' },
    'budgets.empty': { es: 'No hay presupuestos', en: 'No budgets found' },
    'budgets.create_first': { es: 'Crea tu primer presupuesto', en: 'Create your first budget' },
    'goals.title': { es: 'Metas de Ahorro', en: 'Savings Goals' },
    'goals.subtitle': {
      es: 'Define, sigue y alcanza tus objetivos financieros',
      en: 'Define, track, and achieve your financial goals',
    },
    'goals.add': { es: 'Nueva Meta', en: 'New Goal' },
    'goals.empty_title': { es: 'No hay metas aún', en: 'No goals yet' },
    'goals.empty_desc': {
      es: 'Comienza creando tu primera meta de ahorro para visualizar tu progreso.',
      en: 'Start by creating your first saving goal to visualize your progress.',
    },
    'goals.target': { es: 'Meta', en: 'Target' },
    'goals.add_funds': { es: 'Agregar Fondos', en: 'Add Funds' },
    'goals.confirm_delete': {
      es: '¿Estás seguro de eliminar esta meta?',
      en: 'Are you sure you want to delete this goal?',
    },
    'goals.edit_title': { es: 'Editar Meta', en: 'Edit Goal' },
    'goals.new_title': { es: 'Nueva Meta', en: 'New Goal' },
    'goals.field_name': { es: 'Nombre de la Meta', en: 'Goal Name' },
    'goals.field_target': { es: 'Monto Objetivo', en: 'Target Amount' },
    'goals.field_current': { es: 'Monto Actual', en: 'Current Amount' },
    'goals.field_date': { es: 'Fecha Objetivo', en: 'Target Date' },
    'goals.delete_title': { es: '¿Eliminar Meta?', en: 'Delete Goal?' },
    'goals.history_title': { es: 'Historial de Aportes', en: 'Contribution History' },
    'goals.no_contributions': { es: 'No hay aportes aún.', en: 'No contributions yet.' },
    'goals.delete_contribution_title': { es: '¿Eliminar Aporte?', en: 'Delete Contribution?' },
    'goals.delete_contribution_msg': {
      es: '¿Estás seguro de que deseas eliminar este aporte? Esto disminuirá el monto ahorrado.',
      en: 'Are you sure you want to delete this contribution? This will decrease your saved amount.',
    },
    'goals.contribution_deleted': { es: 'Aporte eliminado', en: 'Contribution deleted' },
    'goals.contribution_added': { es: '¡Aporte agregado!', en: 'Contribution added!' },
    'goals.goal_deleted': { es: 'Meta eliminada', en: 'Goal deleted' },
    'goals.goal_created': { es: 'Meta creada', en: 'Goal created' },
    'goals.goal_updated': { es: 'Meta actualizada', en: 'Goal updated' },

    // General Actions
    'action.save': { es: 'Guardar', en: 'Save' },
    'action.cancel': { es: 'Cancelar', en: 'Cancel' },
    'reminders.title': { es: 'Recordatorios', en: 'Reminders' },
    'reminders.desc': {
      es: '¡Recordatorios de facturas y alertas pronto!',
      en: 'Bill reminders and alerts coming soon!',
    },
    'reminders.empty_title': { es: 'Aún no tienes recordatorios', en: 'No reminders yet' },
    'reminders.empty_desc': {
      es: 'Crea un recordatorio para no olvidar ningún pago.',
      en: 'Create a reminder so you never miss a payment.',
    },
    'reminders.new_title': { es: 'Nuevo Recordatorio', en: 'New Reminder' },
    'recurring.title': { es: 'Gastos Recurrentes', en: 'Recurring Expenses' },
    'recurring.desc': {
      es: '¡Administra suscripciones y facturas recurrentes pronto!',
      en: 'Manage subscriptions and recurring bills soon!',
    },
    'recurring.subtitle': {
      es: 'Administra tus suscripciones y facturas',
      en: 'Manage your automated subscriptions and bills',
    },
    'recurring.new': { es: 'Nuevo', en: 'New' },
    'recurring.empty': { es: 'No hay gastos recurrentes', en: 'No recurring expenses' },
    'recurring.create_now': { es: 'Crear uno ahora', en: 'Create one now' },
    'recurring.next_payment': { es: 'Próximo pago', en: 'Next payment' },
    'recurring.edit_title': { es: 'Editar Gasto Recurrente', en: 'Edit Recurring Expense' },
    'recurring.new_title': { es: 'Nuevo Gasto Recurrente', en: 'New Recurring Expense' },
    'recurring.modal_desc': {
      es: 'Automatiza tus pagos regulares',
      en: 'Automate your regular payments',
    },
    'recurring.freq': { es: 'Frecuencia', en: 'Frequency' },
    'recurring.day_month': { es: 'Día del Mes', en: 'Day of Month' },
    'recurring.day_week': { es: 'Día de la Semana', en: 'Day of Week' },
    'recurring.duration': { es: 'Duración', en: 'Duration' },
    'recurring.indefinite': { es: 'Indefinido', en: 'Indefinite' },
    'recurring.fixed': { es: 'Definir Fin', en: 'Set End Date' },
    'recurring.how_many': {
      es: '¿Cuántas veces ocurrirá?',
      en: 'How many times should this expense occur?',
    },
    'recurring.times': { es: 'Veces', en: 'Times' },
    'recurring.update_btn': { es: 'Actualizar Gasto', en: 'Update Expense' },
    'recurring.create_btn': { es: 'Crear Gasto Recurrente', en: 'Create Recurring Expense' },
    'recurring.delete_title': { es: '¿Eliminar Gasto?', en: 'Delete Expense?' },
    'recurring.delete_confirm': {
      es: '¿Seguro que deseas eliminar',
      en: 'Are you sure you want to delete',
    },
    'recurring.updated': { es: 'Gasto recurrente actualizado', en: 'Recurring expense updated' },
    'recurring.created': { es: 'Gasto recurrente creado', en: 'Recurring expense created' },
    'recurring.deleted': { es: 'Gasto eliminado', en: 'Expense deleted' },
    'recurring.fail': { es: 'Operación fallida', en: 'Operation failed' },
    'recurring.inactive': { es: 'INACTIVO', en: 'INACTIVE' },
    'recurring.freq_daily': { es: 'Diario', en: 'Daily' },
    'recurring.freq_weekly': { es: 'Semanal', en: 'Weekly' },
    'recurring.freq_monthly': { es: 'Mensual', en: 'Monthly' },
    'recurring.freq_yearly': { es: 'Anual', en: 'Yearly' },
    'weekdays.mon': { es: 'Lunes', en: 'Monday' },
    'weekdays.tue': { es: 'Martes', en: 'Tuesday' },
    'weekdays.wed': { es: 'Miércoles', en: 'Wednesday' },
    'weekdays.thu': { es: 'Jueves', en: 'Thursday' },
    'weekdays.fri': { es: 'Viernes', en: 'Friday' },
    'weekdays.sat': { es: 'Sábado', en: 'Saturday' },
    'weekdays.sun': { es: 'Domingo', en: 'Sunday' },

    'reminders.setup': {
      es: 'Configura los detalles de tu alerta',
      en: 'Set up your alert details',
    },
    'reminders.delete_title': { es: '¿Eliminar Recordatorio?', en: 'Delete Reminder?' },
    'reminders.delete_confirm': {
      es: '¿Estás seguro de que deseas eliminar este recordatorio',
      en: 'Are you sure you want to delete this reminder',
    },
    'reminders.created': { es: 'Recordatorio creado', en: 'Reminder created' },
    'reminders.updated': { es: 'Recordatorio actualizado', en: 'Reminder updated' },
    'reminders.deleted': { es: 'Recordatorio eliminado', en: 'Reminder deleted' },
    'reminders.fail_create': { es: 'Error al crear recordatorio', en: 'Failed to create reminder' },
    'reminders.fail_update': {
      es: 'Error al actualizar recordatorio',
      en: 'Failed to update reminder',
    },
    'reminders.fail_delete': { es: 'Error al eliminar', en: 'Failed to delete' },

    // Forms
    'forms.description_optional': {
      es: 'Descripción (Opcional)',
      en: 'Description (Optional)',
    },
    'forms.add': { es: 'Agregar', en: 'Add' },

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
    'notif.operation_failed': { es: 'La operación falló', en: 'Operation failed' },
    'alert.reminder_due': { es: 'Recordatorio', en: 'Reminder Due' },
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
    'notif.budget_warning': {
      es: '¡Atención! Has usado el {{percent}}% de tu presupuesto de {{category}}.',
      en: "Heads up! You've used {{percent}}% of your {{category}} budget.",
    },
    'notif.budget_exceeded': {
      es: '¡Oh no! Has excedido tu presupuesto de {{category}} ({{percent}}%).',
      en: "Uh oh! You've exceeded your {{category}} budget ({{percent}}%).",
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
    'settings.session_invalid': {
      es: 'Tu sesión no es válida. Vuelve a iniciar sesión.',
      en: 'Your session is invalid. Please sign in again.',
    },
    // Categories (Normalized keys: cat.{lowercase_name})
    'cat.food': { es: 'Comida', en: 'Food' },
    'cat.comida': { es: 'Comida', en: 'Food' },

    'cat.transport': { es: 'Transporte', en: 'Transport' },
    'cat.transporte': { es: 'Transporte', en: 'Transport' },

    'cat.alimentacion': { es: 'Alimentación', en: 'Food' },
    'cat.alimentation': { es: 'Alimentación', en: 'Food' },

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

    'cat.general': { es: 'General', en: 'General' },
  };

  /**
   * Get translation for a key
   */
  translate(key: string, params?: Record<string, string | number>): string {
    const term = this.dictionary[key];
    if (!term) return key;
    let str = term[this.currentLang()];

    if (params) {
      Object.keys(params).forEach((param) => {
        str = str.replace(new RegExp(`{{${param}}}`, 'g'), String(params[param]));
      });
    }

    return str;
  }

  translateCategory(categoryName: string): string {
    if (!categoryName) return '';
    // Normalize: lowercase, remove accents, replace spaces with underscore
    const normalized = categoryName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ /g, '_');

    const key = 'cat.' + normalized;
    const term = this.dictionary[key];
    if (term) return term[this.currentLang()];

    // Fallback: Format the raw name (replace underscores with spaces, capitalize)
    return categoryName.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }

  /**
   * Helper signal to use in templates efficiently.
   * We explicitly depend on currentLang to ensure reactivity.
   */
  t = computed(() => {
    const lang = this.currentLang(); // Dependency
    return (key: string, params?: Record<string, string | number>) => {
      const term = this.dictionary[key];
      if (!term) {
        // Special check for dynamic category keys to avoid spamming warn if not found
        if (key.startsWith('cat.')) return key.replace('cat.', '');

        console.warn(`Missing translation for key: ${key}`);
        return key;
      }
      let str = term[lang] || key;

      if (params) {
        Object.keys(params).forEach((param) => {
          str = str.replace(new RegExp(`{{${param}}}`, 'g'), String(params[param]));
        });
      }
      return str;
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
      }, 150);
    }, 150);
  }

  setLang(lang: Language) {
    this.currentLang.set(lang);
    localStorage.setItem('lang', lang);
  }
}
