import type { LegalDocument } from '../types'

const privacyEn: LegalDocument = {
  slug: 'privacy',
  updatedAt: '2026-07-16',
  intro:
    'This Privacy Policy describes how Crecik handles the personal data of its users, in accordance with Uruguayan Law No. 18.331 on the Protection of Personal Data and Habeas Data Action, and its regulatory Decree 414/009.',
  sections: [
    {
      id: 'responsable',
      heading: 'Data controller',
      blocks: [
        { kind: 'paragraph', text: 'The controller of the database and of the processing of your personal data is the owner of this site, domiciled in Uruguay.' },
        { kind: 'placeholder', text: 'Owner: [OWNER FULL NAME] — Contact: [CONTACT EMAIL]' },
      ],
    },
    {
      id: 'datos',
      heading: 'Data we process',
      blocks: [
        { kind: 'paragraph', text: 'We only process the data needed to provide the service:' },
        { kind: 'list', items: [
          'Account data: full name, email address, password (stored as a hash) and preferred language.',
          'Financial data you enter: accounts, transactions (amount, date, payee, payment method, notes and tags), categories, budgets, savings goals and recurring entries.',
          'Attachments you choose to upload (for example, PDF receipts).',
          'Minimum technical data stored in your browser (see the Cookies and Storage Policy).',
        ] },
      ],
    },
    {
      id: 'finalidades',
      heading: 'Purposes of the processing',
      blocks: [
        { kind: 'list', items: [
          'Creating and managing your account and authenticating you.',
          'Providing the application features (recording and analysing your personal finances).',
          'Handling your requests and support communications.',
          'Complying with applicable legal obligations.',
        ] },
      ],
    },
    {
      id: 'base-legal',
      heading: 'Legal basis',
      blocks: [
        { kind: 'paragraph', text: 'The processing is based on your free, prior, express and informed consent, given when you sign up, and on the need to perform the service relationship you request. You may withdraw your consent at any time, without retroactive effect.' },
      ],
    },
    {
      id: 'conservacion',
      heading: 'Retention',
      blocks: [
        { kind: 'paragraph', text: 'We keep your data for as long as your account remains active. If you request the deletion of your account, the data is erased except for any we must retain by legal obligation.' },
      ],
    },
    {
      id: 'terceros',
      heading: 'Recipients and third parties',
      blocks: [
        { kind: 'paragraph', text: 'We do not sell your data. We may rely on providers acting on our behalf:' },
        { kind: 'list', items: [
          'Hosting provider where the application runs and the database is stored.',
        ] },
        { kind: 'placeholder', text: 'Hosting provider: [PROVIDER NAME AND COUNTRY]' },
      ],
    },
    {
      id: 'tipografias',
      heading: 'Typography',
      blocks: [
        { kind: 'paragraph', text: 'The typography on this site (Inter, Space Grotesk and Material Symbols) is served from this same domain. No IP address or other personal data is shared with third parties to render the fonts.' },
        { kind: 'paragraph', text: 'These fonts are distributed under the SIL Open Font License 1.1 by their respective authors. The licence text is available at https://openfontlicense.org/open-font-license-official-text/.' },
      ],
    },
    {
      id: 'transferencias',
      heading: 'International transfers',
      blocks: [
        { kind: 'paragraph', text: 'Some providers may process data outside Uruguay. In that case, we ensure that there is an adequate level of protection or the guarantees required by Uruguayan regulations.' },
      ],
    },
    {
      id: 'derechos',
      heading: 'Your rights',
      blocks: [
        { kind: 'paragraph', text: 'You may exercise your rights of access, rectification, update, inclusion and deletion of your data (habeas data action), as well as withdraw your consent.' },
        { kind: 'placeholder', text: 'To exercise them, write to us at: [CONTACT EMAIL]' },
        { kind: 'paragraph', text: 'You may also file a complaint with the Unidad Reguladora y de Control de Datos Personales (URCDP) of Uruguay if you believe the processing does not comply with the regulations.' },
      ],
    },
    {
      id: 'seguridad',
      heading: 'Security',
      blocks: [
        { kind: 'paragraph', text: 'We apply reasonable technical and organisational measures to protect your data, including password encryption and the use of secure connections. No system is completely infallible.' },
      ],
    },
    {
      id: 'menores',
      heading: 'Minors',
      blocks: [
        { kind: 'paragraph', text: 'The service is not aimed at minors. If we detect data belonging to a minor without proper authorisation, we will delete it.' },
      ],
    },
    {
      id: 'cambios',
      heading: 'Changes to this policy',
      blocks: [
        { kind: 'paragraph', text: 'We may update this policy. The current version will be published on this page, showing the date of the last update.' },
      ],
    },
  ],
}

export default privacyEn
