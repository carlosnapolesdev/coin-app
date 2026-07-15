import type { LegalDocument } from '../types'

const legalNoticeEs: LegalDocument = {
  slug: 'legal-notice',
  updatedAt: '2026-07-14',
  intro: 'Información general sobre el titular y las condiciones de este sitio.',
  sections: [
    {
      id: 'titular',
      heading: 'Titular del sitio',
      blocks: [
        { kind: 'paragraph', text: 'Este sitio y la aplicación CoinFlow son operados por su titular, con domicilio en Uruguay.' },
        { kind: 'placeholder', text: 'Titular: [NOMBRE COMPLETO] — Correo: [EMAIL DE CONTACTO] — Sitio: coinlow.org' },
      ],
    },
    {
      id: 'objeto',
      heading: 'Objeto',
      blocks: [
        { kind: 'paragraph', text: 'El sitio ofrece una aplicación gratuita de gestión de finanzas personales.' },
      ],
    },
    {
      id: 'propiedad',
      heading: 'Propiedad intelectual',
      blocks: [
        { kind: 'paragraph', text: 'Los contenidos, el software, la marca y el diseño del sitio están protegidos por la normativa de propiedad intelectual y pertenecen a su titular, salvo indicación en contrario.' },
      ],
    },
    {
      id: 'responsabilidad',
      heading: 'Responsabilidad',
      blocks: [
        { kind: 'paragraph', text: 'El titular no se responsabiliza del uso indebido de la aplicación ni de las decisiones que las personas usuarias adopten a partir de la información que registran.' },
      ],
    },
    {
      id: 'legislacion',
      heading: 'Legislación aplicable',
      blocks: [
        { kind: 'paragraph', text: 'Este aviso se rige por la legislación de la República Oriental del Uruguay. Consulta también nuestra Política de Privacidad, los Términos de Uso y la Política de Cookies.' },
      ],
    },
  ],
}

export default legalNoticeEs
