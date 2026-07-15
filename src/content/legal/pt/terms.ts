import type { LegalDocument } from '../types'

const termsPt: LegalDocument = {
  slug: 'terms',
  updatedAt: '2026-07-14',
  intro:
    'Estes Termos e Condições de Uso regulam o acesso e o uso do CoinFlow. Ao criar uma conta ou usar o serviço, você aceita estes termos.',
  sections: [
    {
      id: 'objeto',
      heading: 'Objeto e aceitação',
      blocks: [
        { kind: 'paragraph', text: 'O CoinFlow é um aplicativo gratuito de gestão de finanças pessoais. O uso do serviço implica a aceitação plena destes termos e da Política de Privacidade.' },
      ],
    },
    {
      id: 'servicio',
      heading: 'Descrição do serviço',
      blocks: [
        { kind: 'paragraph', text: 'O serviço permite que você registre contas, transações, orçamentos, metas e lançamentos recorrentes, e visualize relatórios sobre suas finanças pessoais.' },
      ],
    },
    {
      id: 'no-asesoramiento',
      heading: 'Não é aconselhamento financeiro',
      blocks: [
        { kind: 'note', text: 'O CoinFlow é uma ferramenta de organização pessoal. Não constitui aconselhamento financeiro, contábil, fiscal nem de investimento. As decisões que você tomar com base nas informações do aplicativo são de sua exclusiva responsabilidade.' },
      ],
    },
    {
      id: 'cuenta',
      heading: 'Cadastro e conta',
      blocks: [
        { kind: 'paragraph', text: 'Você é responsável pela veracidade dos dados de cadastro e por manter a confidencialidade das suas credenciais, bem como por toda atividade realizada a partir da sua conta.' },
      ],
    },
    {
      id: 'uso-aceptable',
      heading: 'Uso aceitável',
      blocks: [
        { kind: 'paragraph', text: 'Você se compromete a não:' },
        { kind: 'list', items: [
          'Usar o serviço para fins ilícitos ou não autorizados.',
          'Tentar violar a segurança ou o correto funcionamento do sistema.',
          'Acessar contas ou dados de terceiros sem autorização.',
        ] },
      ],
    },
    {
      id: 'contenido-usuario',
      heading: 'Seu conteúdo',
      blocks: [
        { kind: 'paragraph', text: 'Os dados e arquivos que você insere são seus. Você nos concede apenas as permissões técnicas necessárias para armazená-los e exibi-los como parte do serviço.' },
      ],
    },
    {
      id: 'propiedad',
      heading: 'Propriedade intelectual',
      blocks: [
        { kind: 'paragraph', text: 'O software, a marca CoinFlow, o design e demais elementos do site pertencem ao seu titular e estão protegidos pela legislação aplicável.' },
      ],
    },
    {
      id: 'garantias',
      heading: 'Exclusão de garantias',
      blocks: [
        { kind: 'paragraph', text: 'O serviço é oferecido "como está" e "conforme disponibilidade", sem garantias de qualquer tipo. Não garantimos que esteja livre de erros ou interrupções.' },
      ],
    },
    {
      id: 'responsabilidad',
      heading: 'Limitação de responsabilidade',
      blocks: [
        { kind: 'paragraph', text: 'Na máxima extensão permitida por lei, o titular não será responsável por danos indiretos, perda de dados ou lucros cessantes decorrentes do uso ou impossibilidade de uso do serviço.' },
      ],
    },
    {
      id: 'suspension',
      heading: 'Suspensão e cancelamento',
      blocks: [
        { kind: 'paragraph', text: 'Você pode parar de usar o serviço e solicitar o cancelamento a qualquer momento. Podemos suspender contas que descumprirem estes termos.' },
      ],
    },
    {
      id: 'ley',
      heading: 'Lei aplicável e jurisdição',
      blocks: [
        { kind: 'paragraph', text: 'Estes termos são regidos pelas leis da República Oriental do Uruguai. Qualquer controvérsia será submetida aos tribunais competentes do Uruguai.' },
      ],
    },
    {
      id: 'cambios',
      heading: 'Modificações',
      blocks: [
        { kind: 'paragraph', text: 'Podemos modificar estes termos. A versão vigente estará sempre disponível nesta página com sua data de atualização.' },
      ],
    },
    {
      id: 'contacto',
      heading: 'Contato',
      blocks: [
        { kind: 'placeholder', text: 'Para dúvidas sobre estes termos: [E-MAIL DE CONTATO]' },
      ],
    },
  ],
}

export default termsPt
