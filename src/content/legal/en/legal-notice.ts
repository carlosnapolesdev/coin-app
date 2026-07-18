import type { LegalDocument } from '../types'

const legalNoticeEn: LegalDocument = {
  slug: 'legal-notice',
  updatedAt: '2026-07-14',
  intro: 'General information about the owner of this site and its conditions.',
  sections: [
    {
      id: 'titular',
      heading: 'Site owner',
      blocks: [
        { kind: 'paragraph', text: 'This site and the Crecik application are operated by its owner, domiciled in Uruguay.' },
        { kind: 'placeholder', text: 'Owner: [FULL NAME] — Email: [CONTACT EMAIL] — Website: coinlow.org' },
      ],
    },
    {
      id: 'objeto',
      heading: 'Purpose',
      blocks: [
        { kind: 'paragraph', text: 'The site offers a free personal finance management application.' },
      ],
    },
    {
      id: 'propiedad',
      heading: 'Intellectual property',
      blocks: [
        { kind: 'paragraph', text: 'The content, software, brand and design of the site are protected by intellectual property regulations and belong to its owner, unless otherwise stated.' },
      ],
    },
    {
      id: 'responsabilidad',
      heading: 'Liability',
      blocks: [
        { kind: 'paragraph', text: 'The owner is not responsible for the misuse of the application or for the decisions users make based on the information they enter.' },
      ],
    },
    {
      id: 'legislacion',
      heading: 'Governing law',
      blocks: [
        { kind: 'paragraph', text: 'This notice is governed by the laws of the Eastern Republic of Uruguay. Please also see our Privacy Policy, Terms of Use and Cookies Policy.' },
      ],
    },
  ],
}

export default legalNoticeEn
