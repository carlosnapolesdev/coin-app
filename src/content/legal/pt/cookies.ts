import type { LegalDocument } from '../types'

const cookiesPt: LegalDocument = {
  slug: 'cookies',
  updatedAt: '2026-07-16',
  intro:
    'Esta política explica o armazenamento que o Crecik usa no seu navegador. Não usamos cookies de publicidade ou rastreamento, nem ferramentas de análise de terceiros.',
  sections: [
    {
      id: 'intro',
      heading: 'Nossa abordagem',
      blocks: [
        { kind: 'paragraph', text: 'O Crecik não usa cookies não essenciais. Por isso não exibimos um banner de consentimento de cookies: o armazenamento que utilizamos é estritamente necessário para o funcionamento do aplicativo.' },
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
          'Idioma (crecik-locale): o idioma que você selecionou.',
          'Tema (crecik-theme): sua preferência de modo claro ou escuro.',
        ] },
      ],
    },
    {
      id: 'terceros',
      heading: 'Recursos de terceiros',
      blocks: [
        { kind: 'paragraph', text: 'A tipografia deste site (Inter, Space Grotesk e Material Symbols) é servida a partir deste mesmo domínio e não é transmitida a serviços externos. Para exibir as fontes, nenhum endereço IP ou outro dado pessoal é compartilhado com terceiros. Essas fontes são distribuídas sob a SIL Open Font License 1.1 por seus respectivos autores.' },
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
