import type { MessageSchema } from './en'

const pt: MessageSchema = {
  common: {
    loading: 'Carregando',
    retry: 'Tentar novamente',
    cancel: 'Cancelar',
    delete: 'Excluir',
    close: 'Fechar',
    save: 'Salvar',
    viewAll: 'Ver tudo',
    areYouSure: 'Tem certeza?',
    uncategorized: 'Sem categoria',
    transactionFallback: 'Transação',
    edit: 'Editar',
    prev: 'Anterior',
    next: 'Próxima',
    pageOf: 'Página {page} de {total}',
  },
  languagePicker: {
    label: 'Idioma',
    en: 'English',
    es: 'Español',
    pt: 'Português',
  },
  topHeader: {
    help: 'Ajuda',
  },
  userMenu: {
    settings: 'Configurações',
    theme: 'Tema',
    signOut: 'Sair',
    account: 'Conta',
  },
  sidebar: {
    subtitle: 'Finanças Pessoais',
    soon: 'Em breve',
    nav: {
      dashboard: 'Painel',
      categories: 'Categorias',
      accounts: 'Contas',
      transactions: 'Transações',
      budgets: 'Orçamentos',
      goals: 'Metas',
      recurring: 'Recorrentes',
      reports: 'Relatórios',
      settings: 'Configurações',
    },
  },
}

export default pt