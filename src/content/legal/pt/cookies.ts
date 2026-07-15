import type { LegalDocument } from '../types'

const cookiesPt: LegalDocument = {
  slug: 'cookies',
  updatedAt: '2026-07-14',
  intro:
    'Esta política explica o armazenamento que o CoinFlow usa no seu navegador. Não usamos cookies de publicidade ou rastreamento, nem ferramentas de análise de terceiros.',
  sections: [
    {
      id: 'intro',
      heading: 'Nossa abordagem',
      blocks: [
        { kind: 'paragraph', text: 'O CoinFlow não usa cookies não essenciais. Por isso não exibimos um banner de consentimento de cookies: o armazenamento que utilizamos é estritamente necessário para o funcionamento do aplicativo.' },
      ],
    },
    {
      id: 'almacenamiento',
      heading: 'Armazenamento técnico que usamos',
      blocks: [
        { kind: 'paragraph', text: 'Guardamos as seguintes informações no armazenamento local do seu navegador (localStorage/sessionStorage):' },
        { kind: 'list', items: [
          'Sessão de acesso: o token que mantém você autenticado.',
          'Lembrar-me: o identificador para preencher previamente o seu acesso, se você escolher essa opção.',
          'Idioma (coinflow-locale): o idioma que você selecionou.',
          'Tema (coinflow-theme): sua preferência de modo claro ou escuro.',
        ] },
      ],
    },
    {
      id: 'terceros',
      heading: 'Recursos de terceiros',
      blocks: [
        { kind: 'paragraph', text: 'O site carrega fontes do Google Fonts. Ao fazê-lo, seu endereço IP pode ser recebido pelo Google. Consulte a Política de Privacidade para mais detalhes.' },
      ],
    },
    {
      id: 'gestion',
      heading: 'Como apagar este armazenamento',
      blocks: [
        { kind: 'paragraph', text: 'Você pode apagar o armazenamento local nas configurações do seu navegador ou ao sair da conta. Se apagá-lo, precisará entrar novamente e reselecionar suas preferências.' },
      ],
    },
  ],
}

export default cookiesPt
