import type { LegalDocument } from '../types'

const termsEs: LegalDocument = {
  slug: 'terms',
  updatedAt: '2026-07-14',
  intro:
    'Estos Términos y Condiciones de Uso regulan el acceso y uso de CoinFlow. Al crear una cuenta o usar el servicio, aceptas estos términos.',
  sections: [
    {
      id: 'objeto',
      heading: 'Objeto y aceptación',
      blocks: [
        { kind: 'paragraph', text: 'CoinFlow es una aplicación gratuita de gestión de finanzas personales. El uso del servicio implica la aceptación plena de estos términos y de la Política de Privacidad.' },
      ],
    },
    {
      id: 'servicio',
      heading: 'Descripción del servicio',
      blocks: [
        { kind: 'paragraph', text: 'El servicio te permite registrar cuentas, transacciones, presupuestos, metas y movimientos recurrentes, y visualizar informes sobre tus finanzas personales.' },
      ],
    },
    {
      id: 'no-asesoramiento',
      heading: 'No es asesoramiento financiero',
      blocks: [
        { kind: 'note', text: 'CoinFlow es una herramienta de organización personal. No constituye asesoramiento financiero, contable, fiscal ni de inversión. Las decisiones que tomes en base a la información de la app son de tu exclusiva responsabilidad.' },
      ],
    },
    {
      id: 'cuenta',
      heading: 'Registro y cuenta',
      blocks: [
        { kind: 'paragraph', text: 'Eres responsable de la veracidad de los datos de registro y de mantener la confidencialidad de tus credenciales, así como de toda actividad realizada desde tu cuenta.' },
      ],
    },
    {
      id: 'uso-aceptable',
      heading: 'Uso aceptable',
      blocks: [
        { kind: 'paragraph', text: 'Te comprometes a no:' },
        { kind: 'list', items: [
          'Usar el servicio para fines ilícitos o no autorizados.',
          'Intentar vulnerar la seguridad o el correcto funcionamiento del sistema.',
          'Acceder a cuentas o datos de terceros sin autorización.',
        ] },
      ],
    },
    {
      id: 'contenido-usuario',
      heading: 'Tu contenido',
      blocks: [
        { kind: 'paragraph', text: 'Los datos y archivos que introduces son tuyos. Nos otorgas únicamente los permisos técnicos necesarios para almacenarlos y mostrártelos como parte del servicio.' },
      ],
    },
    {
      id: 'propiedad',
      heading: 'Propiedad intelectual',
      blocks: [
        { kind: 'paragraph', text: 'El software, la marca CoinFlow, el diseño y demás elementos del sitio pertenecen a su titular y están protegidos por la normativa aplicable.' },
      ],
    },
    {
      id: 'garantias',
      heading: 'Exclusión de garantías',
      blocks: [
        { kind: 'paragraph', text: 'El servicio se ofrece «tal cual» y «según disponibilidad», sin garantías de ningún tipo. No garantizamos que esté libre de errores o interrupciones.' },
      ],
    },
    {
      id: 'responsabilidad',
      heading: 'Limitación de responsabilidad',
      blocks: [
        { kind: 'paragraph', text: 'En la máxima medida permitida por la ley, el titular no será responsable por daños indirectos, pérdida de datos o lucro cesante derivados del uso o imposibilidad de uso del servicio.' },
      ],
    },
    {
      id: 'suspension',
      heading: 'Suspensión y baja',
      blocks: [
        { kind: 'paragraph', text: 'Puedes dejar de usar el servicio y solicitar la baja en cualquier momento. Podemos suspender cuentas que incumplan estos términos.' },
      ],
    },
    {
      id: 'ley',
      heading: 'Ley aplicable y jurisdicción',
      blocks: [
        { kind: 'paragraph', text: 'Estos términos se rigen por las leyes de la República Oriental del Uruguay. Cualquier controversia se someterá a los tribunales competentes de Uruguay.' },
      ],
    },
    {
      id: 'cambios',
      heading: 'Modificaciones',
      blocks: [
        { kind: 'paragraph', text: 'Podemos modificar estos términos. La versión vigente estará siempre disponible en esta página con su fecha de actualización.' },
      ],
    },
    {
      id: 'contacto',
      heading: 'Contacto',
      blocks: [
        { kind: 'placeholder', text: 'Para consultas sobre estos términos: [EMAIL DE CONTACTO]' },
      ],
    },
  ],
}

export default termsEs
