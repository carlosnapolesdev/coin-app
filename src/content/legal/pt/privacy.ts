import type { LegalDocument } from '../types'

const privacyPt: LegalDocument = {
  slug: 'privacy',
  updatedAt: '2026-07-16',
  intro:
    'Esta Política de Privacidade descreve como o Crecik trata os dados pessoais das pessoas usuárias, de acordo com a Lei N.º 18.331 de Proteção de Dados Pessoais e Ação de Habeas Data do Uruguai e seu Decreto regulamentar 414/009.',
  sections: [
    {
      id: 'responsable',
      heading: 'Responsável pelo tratamento',
      blocks: [
        { kind: 'paragraph', text: 'O responsável pelo banco de dados e pelo tratamento dos seus dados pessoais é o titular deste site, com domicílio no Uruguai.' },
        { kind: 'placeholder', text: 'Titular: [NOME COMPLETO DO TITULAR] — Contato: [E-MAIL DE CONTATO]' },
      ],
    },
    {
      id: 'datos',
      heading: 'Dados que tratamos',
      blocks: [
        { kind: 'paragraph', text: 'Tratamos apenas os dados necessários para prestar o serviço:' },
        { kind: 'list', items: [
          'Dados de conta: nome completo, endereço de e-mail, senha (armazenada de forma cifrada por hash) e idioma preferido.',
          'Dados financeiros que você insere: contas, transações (valor, data, beneficiário, forma de pagamento, notas e etiquetas), categorias, orçamentos, metas de poupança e lançamentos recorrentes.',
          'Arquivos anexos que você decida enviar (por exemplo, comprovantes em PDF).',
          'Dados técnicos mínimos de funcionamento armazenados no seu navegador (consulte a Política de Cookies e Armazenamento).',
        ] },
      ],
    },
    {
      id: 'finalidades',
      heading: 'Finalidades do tratamento',
      blocks: [
        { kind: 'list', items: [
          'Criar e gerenciar sua conta e autenticá-lo(a).',
          'Prestar as funções do aplicativo (registro e análise das suas finanças pessoais).',
          'Atender suas solicitações e comunicações de suporte.',
          'Cumprir as obrigações legais aplicáveis.',
        ] },
      ],
    },
    {
      id: 'base-legal',
      heading: 'Base legal',
      blocks: [
        { kind: 'paragraph', text: 'O tratamento se baseia no seu consentimento livre, prévio, expresso e informado, concedido ao se cadastrar, e na necessidade de executar a relação de serviço que você solicita. Você pode retirar seu consentimento a qualquer momento, sem efeito retroativo.' },
      ],
    },
    {
      id: 'conservacion',
      heading: 'Conservação',
      blocks: [
        { kind: 'paragraph', text: 'Conservamos seus dados enquanto sua conta estiver ativa. Se você solicitar a exclusão da sua conta, os dados serão apagados, exceto aqueles que devemos conservar por obrigação legal.' },
      ],
    },
    {
      id: 'terceros',
      heading: 'Destinatários e terceiros',
      blocks: [
        { kind: 'paragraph', text: 'Não vendemos seus dados. Podemos contar com fornecedores que atuam em nosso nome:' },
        { kind: 'list', items: [
          'Provedor de hospedagem (hosting) onde o aplicativo é executado e o banco de dados é armazenado.',
        ] },
        { kind: 'placeholder', text: 'Provedor de hosting: [NOME DO PROVEDOR E PAÍS]' },
      ],
    },
    {
      id: 'tipografias',
      heading: 'Tipografia',
      blocks: [
        { kind: 'paragraph', text: 'A tipografia deste site (Inter, Space Grotesk e Material Symbols) é servida a partir deste mesmo domínio. Para exibir as fontes, nenhum endereço IP ou outro dado pessoal é compartilhado com terceiros.' },
        { kind: 'paragraph', text: 'Essas fontes são distribuídas sob a SIL Open Font License 1.1 por seus respectivos autores. O texto completo da licença está disponível em https://openfontlicense.org/open-font-license-official-text/.' },
      ],
    },
    {
      id: 'transferencias',
      heading: 'Transferências internacionais',
      blocks: [
        { kind: 'paragraph', text: 'Alguns fornecedores podem tratar dados fora do Uruguai. Nesse caso, procuramos garantir que exista um nível adequado de proteção ou as garantias exigidas pela legislação uruguaia.' },
      ],
    },
    {
      id: 'derechos',
      heading: 'Seus direitos',
      blocks: [
        { kind: 'paragraph', text: 'Você pode exercer seus direitos de acesso, retificação, atualização, inclusão e exclusão dos seus dados (ação de habeas data), bem como retirar seu consentimento.' },
        { kind: 'placeholder', text: 'Para exercê-los, escreva para: [E-MAIL DE CONTATO]' },
        { kind: 'paragraph', text: 'Você também pode apresentar uma denúncia perante a Unidad Reguladora y de Control de Datos Personales (URCDP) do Uruguai se considerar que o tratamento não está em conformidade com a legislação.' },
      ],
    },
    {
      id: 'seguridad',
      heading: 'Segurança',
      blocks: [
        { kind: 'paragraph', text: 'Aplicamos medidas técnicas e organizacionais razoáveis para proteger seus dados, incluindo a criptografia de senhas e o uso de conexões seguras. Nenhum sistema é completamente infalível.' },
      ],
    },
    {
      id: 'menores',
      heading: 'Menores de idade',
      blocks: [
        { kind: 'paragraph', text: 'O serviço não é destinado a menores de idade. Se detectarmos dados de um menor sem a devida autorização, procederemos à sua exclusão.' },
      ],
    },
    {
      id: 'cambios',
      heading: 'Alterações nesta política',
      blocks: [
        { kind: 'paragraph', text: 'Podemos atualizar esta política. Publicaremos a versão vigente nesta página, indicando a data da última atualização.' },
      ],
    },
  ],
}

export default privacyPt
