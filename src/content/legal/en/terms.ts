import type { LegalDocument } from '../types'

const termsEn: LegalDocument = {
  slug: 'terms',
  updatedAt: '2026-07-14',
  intro:
    'These Terms and Conditions of Use govern the access and use of CoinFlow. By creating an account or using the service, you accept these terms.',
  sections: [
    {
      id: 'objeto',
      heading: 'Purpose and acceptance',
      blocks: [
        { kind: 'paragraph', text: 'CoinFlow is a free personal finance management application. Using the service implies full acceptance of these terms and of the Privacy Policy.' },
      ],
    },
    {
      id: 'servicio',
      heading: 'Service description',
      blocks: [
        { kind: 'paragraph', text: 'The service lets you record accounts, transactions, budgets, goals and recurring entries, and visualise reports about your personal finances.' },
      ],
    },
    {
      id: 'no-asesoramiento',
      heading: 'Not financial advice',
      blocks: [
        { kind: 'note', text: 'CoinFlow is a personal organisation tool. It does not constitute financial, accounting, tax or investment advice. The decisions you make based on the information in the app are your sole responsibility.' },
      ],
    },
    {
      id: 'cuenta',
      heading: 'Registration and account',
      blocks: [
        { kind: 'paragraph', text: 'You are responsible for the accuracy of your registration data and for keeping your credentials confidential, as well as for all activity carried out from your account.' },
      ],
    },
    {
      id: 'uso-aceptable',
      heading: 'Acceptable use',
      blocks: [
        { kind: 'paragraph', text: 'You agree not to:' },
        { kind: 'list', items: [
          'Use the service for unlawful or unauthorised purposes.',
          'Attempt to breach the security or proper functioning of the system.',
          'Access third-party accounts or data without authorisation.',
        ] },
      ],
    },
    {
      id: 'contenido-usuario',
      heading: 'Your content',
      blocks: [
        { kind: 'paragraph', text: 'The data and files you enter are yours. You only grant us the technical permissions necessary to store and display them as part of the service.' },
      ],
    },
    {
      id: 'propiedad',
      heading: 'Intellectual property',
      blocks: [
        { kind: 'paragraph', text: 'The software, the CoinFlow brand, the design and other elements of the site belong to its owner and are protected by applicable law.' },
      ],
    },
    {
      id: 'garantias',
      heading: 'Disclaimer of warranties',
      blocks: [
        { kind: 'paragraph', text: 'The service is provided "as is" and "as available", without warranties of any kind. We do not warrant that it will be free of errors or interruptions.' },
      ],
    },
    {
      id: 'responsabilidad',
      heading: 'Limitation of liability',
      blocks: [
        { kind: 'paragraph', text: 'To the maximum extent permitted by law, the owner shall not be liable for indirect damages, loss of data or lost profits arising from the use or inability to use the service.' },
      ],
    },
    {
      id: 'suspension',
      heading: 'Suspension and cancellation',
      blocks: [
        { kind: 'paragraph', text: 'You may stop using the service and request cancellation at any time. We may suspend accounts that breach these terms.' },
      ],
    },
    {
      id: 'ley',
      heading: 'Governing law and jurisdiction',
      blocks: [
        { kind: 'paragraph', text: 'These terms are governed by the laws of the Eastern Republic of Uruguay. Any dispute shall be submitted to the competent courts of Uruguay.' },
      ],
    },
    {
      id: 'cambios',
      heading: 'Modifications',
      blocks: [
        { kind: 'paragraph', text: 'We may modify these terms. The current version will always be available on this page with its update date.' },
      ],
    },
    {
      id: 'contacto',
      heading: 'Contact',
      blocks: [
        { kind: 'placeholder', text: 'For questions about these terms: [CONTACT EMAIL]' },
      ],
    },
  ],
}

export default termsEn
