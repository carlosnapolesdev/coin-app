import type { LegalDocument } from '../types'

const privacyEs: LegalDocument = {
  slug: 'privacy',
  updatedAt: '2026-07-16',
  intro:
    'Esta Política de Privacidad describe cómo CoinFlow trata los datos personales de las personas usuarias, de acuerdo con la Ley N.º 18.331 de Protección de Datos Personales y Acción de Habeas Data de Uruguay y su Decreto reglamentario 414/009.',
  sections: [
    {
      id: 'responsable',
      heading: 'Responsable del tratamiento',
      blocks: [
        { kind: 'paragraph', text: 'El responsable de la base de datos y del tratamiento de tus datos personales es el titular de este sitio, con domicilio en Uruguay.' },
        { kind: 'placeholder', text: 'Titular: [NOMBRE COMPLETO DEL TITULAR] — Contacto: [EMAIL DE CONTACTO]' },
      ],
    },
    {
      id: 'datos',
      heading: 'Datos que tratamos',
      blocks: [
        { kind: 'paragraph', text: 'Tratamos únicamente los datos necesarios para prestarte el servicio:' },
        { kind: 'list', items: [
          'Datos de cuenta: nombre completo, correo electrónico, contraseña (almacenada de forma cifrada mediante hash) e idioma preferido.',
          'Datos financieros que tú introduces: cuentas, transacciones (importe, fecha, beneficiario, método de pago, notas y etiquetas), categorías, presupuestos, metas de ahorro y movimientos recurrentes.',
          'Archivos adjuntos que decidas subir (por ejemplo, comprobantes en PDF).',
          'Datos técnicos mínimos de funcionamiento almacenados en tu navegador (ver la Política de Cookies y Almacenamiento).',
        ] },
      ],
    },
    {
      id: 'finalidades',
      heading: 'Finalidades del tratamiento',
      blocks: [
        { kind: 'list', items: [
          'Crear y gestionar tu cuenta y autenticarte.',
          'Prestar las funciones de la aplicación (registro y análisis de tus finanzas personales).',
          'Atender tus solicitudes y comunicaciones de soporte.',
          'Cumplir obligaciones legales aplicables.',
        ] },
      ],
    },
    {
      id: 'base-legal',
      heading: 'Base legal',
      blocks: [
        { kind: 'paragraph', text: 'El tratamiento se basa en tu consentimiento libre, previo, expreso e informado, otorgado al registrarte, y en la necesidad de ejecutar la relación de servicio que solicitas. Puedes retirar tu consentimiento en cualquier momento, sin efecto retroactivo.' },
      ],
    },
    {
      id: 'conservacion',
      heading: 'Conservación',
      blocks: [
        { kind: 'paragraph', text: 'Conservamos tus datos mientras tu cuenta permanezca activa. Si solicitas la eliminación de tu cuenta, los datos se suprimen salvo aquellos que debamos conservar por obligación legal.' },
      ],
    },
    {
      id: 'terceros',
      heading: 'Destinatarios y terceros',
      blocks: [
        { kind: 'paragraph', text: 'No vendemos tus datos. Podemos apoyarnos en proveedores que actúan por nuestra cuenta:' },
        { kind: 'list', items: [
          'Proveedor de alojamiento (hosting) donde se ejecuta la aplicación y se almacena la base de datos.',
        ] },
        { kind: 'placeholder', text: 'Proveedor de hosting: [NOMBRE DEL PROVEEDOR Y PAÍS]' },
      ],
    },
    {
      id: 'tipografias',
      heading: 'Tipografía',
      blocks: [
        { kind: 'paragraph', text: 'La tipografía de este sitio (Inter, Space Grotesk y Material Symbols) se sirve desde este mismo dominio. Para mostrar las fuentes no se comparte tu dirección IP ni ningún otro dato personal con terceros.' },
        { kind: 'paragraph', text: 'Estas fuentes se distribuyen bajo la SIL Open Font License 1.1 por sus respectivos autores. El texto completo de la licencia está disponible en https://openfontlicense.org/open-font-license-official-text/.' },
      ],
    },
    {
      id: 'transferencias',
      heading: 'Transferencias internacionales',
      blocks: [
        { kind: 'paragraph', text: 'Algunos proveedores pueden tratar datos fuera de Uruguay. En ese caso, procuramos que exista un nivel adecuado de protección o las garantías exigidas por la normativa uruguaya.' },
      ],
    },
    {
      id: 'derechos',
      heading: 'Tus derechos',
      blocks: [
        { kind: 'paragraph', text: 'Puedes ejercer tus derechos de acceso, rectificación, actualización, inclusión y supresión de tus datos (acción de habeas data), así como retirar tu consentimiento.' },
        { kind: 'placeholder', text: 'Para ejercerlos, escríbenos a: [EMAIL DE CONTACTO]' },
        { kind: 'paragraph', text: 'También puedes presentar una denuncia ante la Unidad Reguladora y de Control de Datos Personales (URCDP) de Uruguay si consideras que el tratamiento no se ajusta a la normativa.' },
      ],
    },
    {
      id: 'seguridad',
      heading: 'Seguridad',
      blocks: [
        { kind: 'paragraph', text: 'Aplicamos medidas técnicas y organizativas razonables para proteger tus datos, incluido el cifrado de contraseñas y el uso de conexiones seguras. Ningún sistema es completamente infalible.' },
      ],
    },
    {
      id: 'menores',
      heading: 'Menores de edad',
      blocks: [
        { kind: 'paragraph', text: 'El servicio no está dirigido a menores de edad. Si detectamos datos de un menor sin la debida autorización, procederemos a eliminarlos.' },
      ],
    },
    {
      id: 'cambios',
      heading: 'Cambios en esta política',
      blocks: [
        { kind: 'paragraph', text: 'Podemos actualizar esta política. Publicaremos la versión vigente en esta página, indicando la fecha de última actualización.' },
      ],
    },
  ],
}

export default privacyEs
