import eslint from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import tseslint from 'typescript-eslint'
import globals from 'globals'

// `no-empty` no sirve para esto: ignora los bloques que contienen un comentario,
// que es justamente la forma que toman los catch silenciados (`catch { // ignore }`).
// Estos selectores miran el AST, donde los comentarios no son sentencias.
const noSilentCatch = [
  'error',
  {
    selector: 'CatchClause > BlockStatement[body.length=0]',
    message:
      'No silencies errores: reporta con logError(context, error), y añade feedback al usuario si el fallo afecta su tarea.',
  },
  {
    selector:
      "CallExpression[callee.property.name='catch'] > ArrowFunctionExpression > BlockStatement[body.length=0]",
    message:
      'No silencies errores: reporta con logError(context, error), y añade feedback al usuario si el fallo afecta su tarea.',
  },
]

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'eslint.config.js'] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  // `essential` y no `recommended`: este último añade tres niveles de reglas de
  // formato (saltos de línea, atributos por línea) que generan miles de avisos
  // sobre código ya escrito y ahogarían los hallazgos que sí importan.
  ...pluginVue.configs['flat/essential'],
  {
    files: ['**/*.{ts,vue}'],
    languageOptions: {
      globals: { ...globals.browser },
      parserOptions: {
        parser: tseslint.parser,
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      'no-restricted-syntax': noSilentCatch,
      // El binding del error debe usarse; si no hace falta, usa `catch {}`
      // (que la regla de arriba bloquea) en vez de capturarlo y descartarlo.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { caughtErrors: 'all', argsIgnorePattern: '^_' },
      ],
      // Ampliar `DefineLocaleMessage` de vue-i18n exige declaration merging, así
      // que tiene que ser una interfaz vacía que extiende otra. Sigue marcando
      // las interfaces vacías de verdad en el resto del código.
      '@typescript-eslint/no-empty-object-type': [
        'error',
        { allowInterfaces: 'with-single-extends' },
      ],
    },
  },
)
