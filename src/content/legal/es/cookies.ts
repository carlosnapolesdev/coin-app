import type { LegalDocument } from '../types'

const cookiesEs: LegalDocument = {
  slug: 'cookies',
  updatedAt: '2026-07-14',
  intro:
    'Esta política explica el almacenamiento que CoinFlow utiliza en tu navegador. No usamos cookies de publicidad ni de rastreo, ni herramientas de analítica de terceros.',
  sections: [
    {
      id: 'intro',
      heading: 'Nuestro enfoque',
      blocks: [
        { kind: 'paragraph', text: 'CoinFlow no utiliza cookies no esenciales. Por eso no mostramos un banner de consentimiento de cookies: el almacenamiento que empleamos es estrictamente necesario para que la aplicación funcione.' },
      ],
    },
    {
      id: 'almacenamiento',
      heading: 'Almacenamiento técnico que usamos',
      blocks: [
        { kind: 'paragraph', text: 'Guardamos la siguiente información en el almacenamiento local de tu navegador (localStorage/sessionStorage):' },
        { kind: 'list', items: [
          'Sesión de acceso: el token que te mantiene autenticado.',
          'Recordarme: el identificador para prerrellenar tu acceso, si eliges esa opción.',
          'Idioma (coinflow-locale): el idioma que seleccionaste.',
          'Tema (coinflow-theme): tu preferencia de modo claro u oscuro.',
        ] },
      ],
    },
    {
      id: 'terceros',
      heading: 'Recursos de terceros',
      blocks: [
        { kind: 'paragraph', text: 'El sitio carga tipografías desde Google Fonts. Al hacerlo, tu dirección IP puede ser recibida por Google. Consulta la Política de Privacidad para más detalle.' },
      ],
    },
    {
      id: 'gestion',
      heading: 'Cómo eliminar este almacenamiento',
      blocks: [
        { kind: 'paragraph', text: 'Puedes borrar el almacenamiento local desde la configuración de tu navegador o cerrando sesión. Si lo eliminas, deberás iniciar sesión y volver a elegir tus preferencias.' },
      ],
    },
  ],
}

export default cookiesEs
