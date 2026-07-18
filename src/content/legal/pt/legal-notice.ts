import type { LegalDocument } from '../types'

const legalNoticePt: LegalDocument = {
  slug: 'legal-notice',
  updatedAt: '2026-07-14',
  intro: 'Informações gerais sobre o titular e as condições deste site.',
  sections: [
    {
      id: 'titular',
      heading: 'Titular do site',
      blocks: [
        { kind: 'paragraph', text: 'Este site e o aplicativo Crecik são operados pelo seu titular, com domicílio no Uruguai.' },
        { kind: 'placeholder', text: 'Titular: [NOME COMPLETO] — E-mail: [E-MAIL DE CONTATO] — Site: coinlow.org' },
      ],
    },
    {
      id: 'objeto',
      heading: 'Objeto',
      blocks: [
        { kind: 'paragraph', text: 'O site oferece um aplicativo gratuito de gestão de finanças pessoais.' },
      ],
    },
    {
      id: 'propiedad',
      heading: 'Propriedade intelectual',
      blocks: [
        { kind: 'paragraph', text: 'Os conteúdos, o software, a marca e o design do site estão protegidos pela legislação de propriedade intelectual e pertencem ao seu titular, salvo indicação em contrário.' },
      ],
    },
    {
      id: 'responsabilidad',
      heading: 'Responsabilidade',
      blocks: [
        { kind: 'paragraph', text: 'O titular não se responsabiliza pelo uso indevido do aplicativo nem pelas decisões que as pessoas usuárias adotem com base nas informações que registram.' },
      ],
    },
    {
      id: 'legislacion',
      heading: 'Legislação aplicável',
      blocks: [
        { kind: 'paragraph', text: 'Este aviso é regido pela legislação da República Oriental do Uruguai. Consulte também nossa Política de Privacidade, os Termos de Uso e a Política de Cookies.' },
      ],
    },
  ],
}

export default legalNoticePt
