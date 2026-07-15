import type { LegalDocument } from '../types'

const cookiesEn: LegalDocument = {
  slug: 'cookies',
  updatedAt: '2026-07-14',
  intro:
    'This policy explains the storage CoinFlow uses in your browser. We do not use advertising or tracking cookies, nor third-party analytics.',
  sections: [
    {
      id: 'intro',
      heading: 'Our approach',
      blocks: [
        { kind: 'paragraph', text: 'CoinFlow does not use non-essential cookies. That is why we do not show a cookie consent banner: the storage we use is strictly necessary for the app to work.' },
      ],
    },
    {
      id: 'almacenamiento',
      heading: 'Technical storage we use',
      blocks: [
        { kind: 'paragraph', text: 'We store the following information in your browser local storage (localStorage/sessionStorage):' },
        { kind: 'list', items: [
          'Login session: the token that keeps you authenticated.',
          'Remember me: the identifier used to pre-fill your login, if you choose that option.',
          'Language (coinflow-locale): the language you selected.',
          'Theme (coinflow-theme): your light or dark mode preference.',
        ] },
      ],
    },
    {
      id: 'terceros',
      heading: 'Third-party resources',
      blocks: [
        { kind: 'paragraph', text: 'The site loads fonts from Google Fonts. When it does, your IP address may be received by Google. See the Privacy Policy for details.' },
      ],
    },
    {
      id: 'gestion',
      heading: 'How to clear this storage',
      blocks: [
        { kind: 'paragraph', text: 'You can clear local storage from your browser settings or by logging out. If you clear it, you will need to sign in again and re-select your preferences.' },
      ],
    },
  ],
}

export default cookiesEn
