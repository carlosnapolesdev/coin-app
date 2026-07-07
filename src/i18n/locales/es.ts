import type { MessageSchema } from './en'

const es: MessageSchema = {
  common: {
    loading: 'Cargando',
    retry: 'Reintentar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    close: 'Cerrar',
    save: 'Guardar',
    viewAll: 'Ver todo',
    areYouSure: '¿Estás seguro?',
    uncategorized: 'Sin categoría',
    transactionFallback: 'Transacción',
    edit: 'Editar',
    prev: 'Anterior',
    next: 'Siguiente',
    pageOf: 'Página {page} de {total}',
  },
  languagePicker: {
    label: 'Idioma',
    en: 'English',
    es: 'Español',
    pt: 'Português',
  },
  topHeader: {
    help: 'Ayuda',
  },
  userMenu: {
    settings: 'Configuración',
    theme: 'Tema',
    signOut: 'Cerrar sesión',
    account: 'Cuenta',
  },
  sidebar: {
    subtitle: 'Finanzas Personales',
    soon: 'Próximamente',
    nav: {
      dashboard: 'Panel',
      categories: 'Categorías',
      accounts: 'Cuentas',
      transactions: 'Transacciones',
      budgets: 'Presupuestos',
      goals: 'Metas',
      recurring: 'Recurrentes',
      reports: 'Informes',
      settings: 'Configuración',
    },
  },
}

export default es