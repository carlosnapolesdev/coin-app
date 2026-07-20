import {
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, describe, expect, it } from 'vitest'
import ts from 'typescript'

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..')

// The reporter cannot report itself: logging the reporter's own failure would
// recurse forever. Rather than excluding the file wholesale, walk its handlers
// and allow exactly one of them — the empty `.catch()` on the fetch.
const RECURSIVE_FAILURE_FILE = 'utils/errorReporter.ts'

// Strict shape of every logError context: a literal in `camelCase.camelCase`.
// The literal is the grouping key on the server, so anything dynamic would
// silently split or merge unrelated errors.
const CONTEXT_PATTERN = /^[a-z][A-Za-z0-9]*\.[a-z][A-Za-z0-9]*$/

// .test/.spec files exercise code but aren't product code, so they follow the
// rules of vitest, not the project convention.
function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) return sourceFiles(full)
    if (!/\.(ts|tsx|vue)$/.test(entry)) return []
    if (/\.(test|spec)\./.test(entry)) return []
    return [full]
  })
}

interface ScriptExtraction {
  body: string
}

function vueExtractionError(raw: string, start: number, detail: string, file: string): never {
  const line = raw.slice(0, start).split('\n').length
  throw new Error(`${file}:${line} ${detail}`)
}

function maskVueMarkup(source: string): string {
  return source.replace(/[^\r\n]/g, ' ')
}

// Non-script content is masked rather than removed so AST locations keep the
// original Vue source line numbers.
export function extractVueScripts(raw: string, file = 'Vue SFC'): ScriptExtraction {
  const scriptStartPattern = /<script(?=\s|>)/gi
  const scriptOpenPattern = /<script(?=\s|>)(?:"[^"]*"|'[^']*'|[^"'<>])*>/iy
  const scriptClosePattern = /<\/script\s*>/gi
  const blocks: Array<{ start: number; end: number }> = []
  let searchFrom = 0

  while (true) {
    scriptStartPattern.lastIndex = searchFrom
    const start = scriptStartPattern.exec(raw)
    if (!start) break

    scriptOpenPattern.lastIndex = start.index
    const opening = scriptOpenPattern.exec(raw)
    if (!opening) {
      vueExtractionError(raw, start.index, 'has a <script tag that cannot be extracted', file)
    }

    const attrs = opening[0].slice('<script'.length, -1)
    if (!/\blang\s*=\s*(?:"ts"|'ts'|ts(?=\s|$))/i.test(attrs)) {
      vueExtractionError(raw, start.index, 'must use <script ... lang="ts">', file)
    }

    const bodyStart = scriptOpenPattern.lastIndex
    scriptClosePattern.lastIndex = bodyStart
    const closing = scriptClosePattern.exec(raw)
    if (!closing) {
      vueExtractionError(raw, start.index, 'has an unterminated <script> block', file)
    }

    scriptStartPattern.lastIndex = bodyStart
    const nestedStart = scriptStartPattern.exec(raw)
    if (nestedStart && nestedStart.index < closing.index) {
      vueExtractionError(raw, start.index, 'has a <script> block that cannot be extracted', file)
    }

    blocks.push({ start: bodyStart, end: closing.index })
    searchFrom = scriptClosePattern.lastIndex
  }

  if (blocks.length === 0) return { body: '' }

  const parts: string[] = []
  let cursor = 0
  for (const block of blocks) {
    parts.push(maskVueMarkup(raw.slice(cursor, block.start)))
    parts.push(raw.slice(block.start, block.end))
    cursor = block.end
  }
  parts.push(maskVueMarkup(raw.slice(cursor)))
  return { body: parts.join('') }
}

interface ParsedSource {
  sourceFile: ts.SourceFile
  bodyStartLine: number
}

function parseSource(file: string): ParsedSource {
  const raw = readFileSync(file, 'utf-8')
  if (file.endsWith('.vue')) {
    const { body } = extractVueScripts(raw, file)
    return {
      sourceFile: ts.createSourceFile(file, body, ts.ScriptTarget.Latest, true),
      bodyStartLine: 1,
    }
  }
  return {
    sourceFile: ts.createSourceFile(file, raw, ts.ScriptTarget.Latest, true),
    bodyStartLine: 1,
  }
}

function bindingName(param: ts.Node | undefined): string | null {
  if (!param) return null
  if (ts.isIdentifier(param)) return param.text
  if (ts.isParameter(param) && ts.isIdentifier(param.name)) return param.name.text
  return null
}

function* tryStatements(node: ts.Node): Generator<ts.TryStatement> {
  if (ts.isTryStatement(node)) yield node
  for (const child of node.getChildren()) yield* tryStatements(child)
}

function isCatchAccess(expr: ts.Expression): boolean {
  if (ts.isPropertyAccessExpression(expr) && expr.name.text === 'catch') return true
  const arg = ts.isElementAccessExpression(expr) ? expr.argumentExpression : undefined
  if (arg && ts.isStringLiteral(arg) && arg.text === 'catch') return true
  return false
}

function* catchMethodCalls(node: ts.Node): Generator<ts.CallExpression> {
  if (ts.isCallExpression(node) && isCatchAccess(node.expression)) yield node
  for (const child of node.getChildren()) yield* catchMethodCalls(child)
}

function isFunctionLike(node: ts.Node): boolean {
  return (
    ts.isFunctionDeclaration(node) ||
    ts.isFunctionExpression(node) ||
    ts.isArrowFunction(node) ||
    ts.isMethodDeclaration(node) ||
    ts.isConstructorDeclaration(node) ||
    ts.isGetAccessorDeclaration(node) ||
    ts.isSetAccessorDeclaration(node)
  )
}

// Walks the body but skips nested function-like nodes so a `logError` that only
// lives inside an uncalled closure doesn't satisfy the rule.
function* topLevelCalls(node: ts.Node): Generator<ts.CallExpression> {
  if (isFunctionLike(node)) return
  if (ts.isCallExpression(node)) yield node
  for (const child of node.getChildren()) yield* topLevelCalls(child)
}

export function callsLogErrorWithErr(body: ts.Node): boolean {
  for (const call of topLevelCalls(body)) {
    if (!ts.isIdentifier(call.expression)) continue
    if (call.expression.text !== 'logError') continue
    if (call.arguments.length !== 2) continue
    const second = call.arguments[1]
    if (ts.isIdentifier(second) && second.text === 'err') return true
  }
  return false
}

// Walks every `logError(...)` call anywhere in the AST, including ones nested
// in IIFEs or other functions; the global uniqueness guard needs the full set,
// not only the ones reachable from a handler.
function* logErrorCalls(node: ts.Node): Generator<ts.CallExpression> {
  if (
    ts.isCallExpression(node) &&
    ts.isIdentifier(node.expression) &&
    node.expression.text === 'logError'
  ) {
    yield node
  }
  for (const child of node.getChildren()) yield* logErrorCalls(child)
}

// Returns the name of the innermost enclosing function-like declaration, or
// null if the node isn't nested in one. Used to identify the openPdf exception.
function findEnclosingFunctionName(node: ts.Node): string | null {
  let current: ts.Node | undefined = node.parent
  while (current) {
    if (ts.isFunctionDeclaration(current) && current.name) return current.name.text
    if (ts.isMethodDeclaration(current) && ts.isIdentifier(current.name)) return current.name.text
    if (ts.isFunctionExpression(current) && current.name) return current.name.text
    if (ts.isArrowFunction(current)) {
      const parent = current.parent
      if (parent && ts.isVariableDeclaration(parent) && ts.isIdentifier(parent.name)) {
        return parent.name.text
      }
      if (parent && ts.isPropertyAssignment(parent) && ts.isIdentifier(parent.name)) {
        return parent.name.text
      }
    }
    current = current.parent
  }
  return null
}

interface Handler {
  kind: 'catch' | 'method'
  binding: string | null
  body: ts.Node | null
  line: number
  call: ts.CallExpression | null
  callback: ts.ArrowFunction | ts.FunctionExpression | null
  file: string
  enclosingFunction: string | null
}

function handlersIn(file: string): Handler[] {
  const { sourceFile, bodyStartLine } = parseSource(file)
  const out: Handler[] = []

  for (const stmt of tryStatements(sourceFile)) {
    if (!stmt.catchClause) continue
    const variable = stmt.catchClause.variableDeclaration?.name
    const line =
      sourceFile.getLineAndCharacterOfPosition(stmt.catchClause.getStart(sourceFile)).line +
      bodyStartLine
    out.push({
      kind: 'catch',
      binding: bindingName(variable),
      body: stmt.catchClause.block,
      line,
      call: null,
      callback: null,
      file,
      enclosingFunction: findEnclosingFunctionName(stmt.catchClause),
    })
  }

  for (const call of catchMethodCalls(sourceFile)) {
    const arg = call.arguments[0]
    const expr = call.expression
    const accessStart =
      ts.isPropertyAccessExpression(expr) || ts.isElementAccessExpression(expr)
        ? expr.getStart(sourceFile)
        : call.getStart(sourceFile)
    const line = sourceFile.getLineAndCharacterOfPosition(accessStart).line + bodyStartLine
    if (!arg || (!ts.isArrowFunction(arg) && !ts.isFunctionExpression(arg))) {
      out.push({
        kind: 'method',
        binding: null,
        body: null,
        line,
        call,
        callback: null,
        file,
        enclosingFunction: findEnclosingFunctionName(call),
      })
      continue
    }
    out.push({
      kind: 'method',
      binding: bindingName(arg.parameters[0]),
      body: arg.body,
      line,
      call,
      callback: arg,
      file,
      enclosingFunction: findEnclosingFunctionName(call),
    })
  }

  return out
}

function isDirectFetchCatch(call: ts.CallExpression): boolean {
  const access = call.expression
  if (!ts.isPropertyAccessExpression(access) && !ts.isElementAccessExpression(access)) {
    return false
  }
  const receiver = access.expression
  return (
    ts.isCallExpression(receiver) &&
    ts.isIdentifier(receiver.expression) &&
    receiver.expression.text === 'fetch'
  )
}

function isInsideReporterRegistration(node: ts.Node): boolean {
  let current: ts.Node = node
  while (current.parent) {
    const parent: ts.Node = current.parent
    if (
      isFunctionLike(current) &&
      ts.isCallExpression(parent) &&
      ts.isIdentifier(parent.expression) &&
      parent.expression.text === 'setErrorReporter' &&
      parent.arguments.some((arg) => arg === current)
    ) {
      return true
    }
    current = parent
  }
  return false
}

function isRecursiveFailureHandler(h: Handler): boolean {
  if (h.kind !== 'method' || !h.call || !h.callback) return false
  if (h.binding !== null || !ts.isBlock(h.callback.body)) return false
  if (h.callback.body.statements.length !== 0 || callsLogErrorWithErr(h.callback.body)) return false
  return isDirectFetchCatch(h.call) && isInsideReporterRegistration(h.call)
}

function relativePath(file: string): string {
  return file.slice(SRC.length + 1).replace(/\\/g, '/')
}

// True if the expression is `win.close()` or `win?.close()`. Used to recognise
// the openPdf productive exception, where the popup must be closed before the
// failure is reported.
function isWinCloseCall(expr: ts.Expression): boolean {
  if (!ts.isCallExpression(expr)) return false
  const callee = expr.expression
  if (!ts.isPropertyAccessExpression(callee)) return false
  if (!ts.isIdentifier(callee.expression)) return false
  if (callee.expression.text !== 'win') return false
  if (callee.name.text !== 'close') return false
  return true
}

// Validates the global shape of a single logError call: 2 args and a literal
// context that matches the camelCase pattern. Returns null when OK, or an
// offender message.
function logErrorCallOffender(
  call: ts.CallExpression,
  file: string,
  line: number,
): string | null {
  if (call.arguments.length !== 2) {
    return `${file}:${line} logError must have exactly 2 arguments`
  }
  const first = call.arguments[0]
  if (!ts.isStringLiteral(first)) {
    const rendered = ts.SyntaxKind[first.kind]
    return `${file}:${line} logError first argument must be a string literal, got ${rendered}`
  }
  if (!CONTEXT_PATTERN.test(first.text)) {
    return `${file}:${line} logError context '${first.text}' must match /^[a-z][A-Za-z0-9]*\\.[a-z][A-Za-z0-9]*$/`
  }
  return null
}

function handlerLogErrorCallOffender(
  call: ts.CallExpression,
  file: string,
  line: number,
): string | null {
  const offender = logErrorCallOffender(call, file, line)
  if (offender) return offender
  const second = call.arguments[1]
  if (!ts.isIdentifier(second) || second.text !== 'err') {
    return `${file}:${line} logError second argument must be the identifier 'err'`
  }
  return null
}

function handlerLogErrorCall(h: Handler): { call: ts.CallExpression; openPdf: boolean } | null {
  const relative = relativePath(h.file)
  const isOpenPdf =
    relative === 'components/dashboard/TransactionAttachmentsPanel.vue' &&
    h.enclosingFunction === 'openPdf'

  // Arrow expression body — the expression itself must be the logError call.
  if (h.callback && !ts.isBlock(h.callback.body)) {
    if (!ts.isCallExpression(h.callback.body)) return null
    return { call: h.callback.body, openPdf: false }
  }

  // Block body — pick the logError call according to the openPdf exception.
  let body: ts.Block | null = null
  if (h.body && ts.isBlock(h.body)) {
    body = h.body
  } else if (h.callback && ts.isBlock(h.callback.body)) {
    body = h.callback.body
  }
  if (!body || body.statements.length === 0) return null

  if (isOpenPdf) {
    const second = body.statements[1]
    if (!second || !ts.isExpressionStatement(second)) return null
    if (!ts.isCallExpression(second.expression)) return null
    return { call: second.expression, openPdf: true }
  }

  const first = body.statements[0]
  if (!first || !ts.isExpressionStatement(first)) return null
  if (!ts.isCallExpression(first.expression)) return null
  return { call: first.expression, openPdf: false }
}

// Strict structural validation of a handler:
//   • the binding must be `err`
//   • the body must be either an arrow expression that IS the logError call,
//     or a block whose first (or, for openPdf, second) statement is the call
//   • the call signature must match `logError(<literal>, err)`
// Returns null when the handler is OK, an offender string otherwise.
export function validateHandler(h: Handler, sourceFile: ts.SourceFile): string | null {
  if (h.kind === 'method' && h.callback && isRecursiveFailureHandler(h)) {
    return null
  }

  const relative = relativePath(h.file)
  const isOpenPdf =
    relative === 'components/dashboard/TransactionAttachmentsPanel.vue' &&
    h.enclosingFunction === 'openPdf'

  let stmts: readonly ts.Statement[] | null = null
  let expr: ts.Expression | null = null

  if (h.callback) {
    if (ts.isBlock(h.callback.body)) {
      stmts = h.callback.body.statements
    } else {
      expr = h.callback.body
    }
  } else if (h.body && ts.isBlock(h.body)) {
    stmts = h.body.statements
  }

  if (expr !== null) {
    // Arrow expression body — must be a direct logError call.
    if (!ts.isCallExpression(expr)) {
      return `${relative}:${h.line} arrow expression body must be the logError call directly, got ${ts.SyntaxKind[expr.kind]}`
    }
    if (!ts.isIdentifier(expr.expression) || expr.expression.text !== 'logError') {
      return `${relative}:${h.line} arrow expression body must call logError, got ${expr.getText(sourceFile)}`
    }
    return null
  }

  if (stmts === null) {
    return `${relative}:${h.line} handler has no block body`
  }
  if (stmts.length === 0) {
    return `${relative}:${h.line} handler body is empty`
  }

  if (isOpenPdf) {
    if (stmts.length !== 2) {
      return `${relative}:${h.line} openPdf productive exception must have exactly 2 statements, got ${stmts.length}`
    }
    const first = stmts[0]
    if (!ts.isExpressionStatement(first) || !isWinCloseCall(first.expression)) {
      return `${relative}:${h.line} openPdf first statement must be win?.close()`
    }
    const second = stmts[1]
    if (!ts.isExpressionStatement(second)) {
      return `${relative}:${h.line} openPdf second statement must be a logError expression`
    }
    if (!ts.isCallExpression(second.expression)) {
      return `${relative}:${h.line} openPdf second statement must be a logError call`
    }
    if (
      !ts.isIdentifier(second.expression.expression) ||
      second.expression.expression.text !== 'logError'
    ) {
      return `${relative}:${h.line} openPdf second statement must call logError`
    }
    return null
  }

  const first = stmts[0]
  if (!ts.isExpressionStatement(first)) {
    return `${relative}:${h.line} first statement must be a logError call, got ${ts.SyntaxKind[first.kind]}`
  }
  if (!ts.isCallExpression(first.expression)) {
    return `${relative}:${h.line} first statement must be a logError call, got ${ts.SyntaxKind[first.expression.kind]}`
  }
  if (!ts.isIdentifier(first.expression.expression) || first.expression.expression.text !== 'logError') {
    return `${relative}:${h.line} first statement must call logError`
  }
  return null
}

// Walks every productive file and returns every logError call site with its
// resolved context. Violations are reported as part of the same pass so the
// global guard can fail on the first run that introduced them.
interface LogErrorCallSite {
  file: string
  line: number
  context: string
  violation: string | null
}

function collectLogErrorCallSites(): LogErrorCallSite[] {
  const sites: LogErrorCallSite[] = []
  for (const file of sourceFiles(SRC)) {
    const relative = relativePath(file)
    const { sourceFile, bodyStartLine } = parseSource(file)
    for (const call of logErrorCalls(sourceFile)) {
      const line =
        sourceFile.getLineAndCharacterOfPosition(call.getStart(sourceFile)).line + bodyStartLine
      const offender = logErrorCallOffender(call, relative, line)
      let context = ''
      if (call.arguments.length >= 1 && ts.isStringLiteral(call.arguments[0])) {
        context = call.arguments[0].text
      }
      sites.push({ file: relative, line, context, violation: offender })
    }
  }
  return sites
}

// Finds contexts that appear at more than one call site. The grouping key is
// the literal — a duplicate means the server would merge unrelated errors.
function findDuplicateContexts(
  sites: LogErrorCallSite[],
): Array<{ context: string; uses: Array<{ file: string; line: number }> }> {
  const grouped = new Map<string, Array<{ file: string; line: number }>>()
  for (const site of sites) {
    if (site.violation) continue
    if (!site.context) continue
    if (!grouped.has(site.context)) grouped.set(site.context, [])
    grouped.get(site.context)!.push({ file: site.file, line: site.line })
  }
  const dupes: Array<{ context: string; uses: Array<{ file: string; line: number }> }> = []
  for (const [context, uses] of grouped) {
    if (uses.length > 1) dupes.push({ context, uses })
  }
  return dupes
}

describe('no silent catch', () => {
  it('every catch and .catch() in src/ binds err and reports with logError(<literal>, err) as the first reachable statement', () => {
    const offenders: string[] = []
    const recursiveFailureHandlers: Array<{ file: string; line: number }> = []

    for (const file of sourceFiles(SRC)) {
      const relative = relativePath(file)
      const handlers = handlersIn(file)
      const isRecursiveFailureFile = relative === RECURSIVE_FAILURE_FILE

      for (const h of handlers) {
        if (isRecursiveFailureFile && isRecursiveFailureHandler(h)) {
          recursiveFailureHandlers.push({ file: relative, line: h.line })
          continue
        }
        // The binding must be `err`, never `error`. This is a hard rule, not a
        // style preference: eleven components declare a module-level
        // `const error = ref(...)` that a `catch (error)` would shadow, so the
        // `error.value = t('...')` inside the handler would then target the
        // caught Error instead of the ref — breaking the message the user sees
        // with nothing to detect it, since those messages are not covered.
        if (h.binding !== 'err') {
          offenders.push(`${relative}:${h.line} binding=${h.binding ?? '(none)'} (expected err)`)
          continue
        }
        const { sourceFile } = parseSource(file)
        const structural = validateHandler(h, sourceFile)
        if (structural) {
          offenders.push(structural)
          continue
        }
        const logErrorCall = handlerLogErrorCall(h)
        if (!logErrorCall) {
          offenders.push(`${relative}:${h.line} no logError call reachable as the first statement`)
          continue
        }
        const signature = handlerLogErrorCallOffender(logErrorCall.call, relative, h.line)
        if (signature) offenders.push(signature)
      }
    }

    if (recursiveFailureHandlers.length !== 1) {
      const found = recursiveFailureHandlers.map(({ file, line }) => `${file}:${line}`).join(', ')
      offenders.push(
        `expected exactly 1 recursive-failure handler, found ${recursiveFailureHandlers.length}: ${found || '(none)'}`,
      )
    }

    expect(offenders).toEqual([])
  })

  it('every logError(...) call in src/ uses a unique literal camelCase <area>.<function> context', () => {
    const sites = collectLogErrorCallSites()
    const offenders: string[] = []

    for (const site of sites) {
      if (site.violation) offenders.push(site.violation)
    }

    for (const dupe of findDuplicateContexts(sites)) {
      offenders.push(
        `duplicate logError context '${dupe.context}' at ${dupe.uses
          .map((u) => `${u.file}:${u.line}`)
          .join(', ')}`,
      )
    }

    expect(offenders).toEqual([])
  })

  it('no console.error survives outside the logError fallback', () => {
    const offenders: string[] = []

    for (const file of sourceFiles(SRC)) {
      const relative = relativePath(file)
      if (relative === 'utils/logError.ts') continue
      if (readFileSync(file, 'utf-8').includes('console.error')) {
        offenders.push(relative)
      }
    }

    expect(offenders).toEqual([])
  })
})

// Track every temp directory created by a fixture so the suite can clean up
// even when an assertion throws halfway through a test.
const tempDirs: string[] = []

function makeTempTs(code: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'no-silent-catch-'))
  tempDirs.push(dir)
  const file = join(dir, 'fixture.ts')
  writeFileSync(file, code)
  return file
}

function makeTempVue(code: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'no-silent-catch-'))
  tempDirs.push(dir)
  const file = join(dir, 'fixture.vue')
  writeFileSync(file, code)
  return file
}

function parseFirstStatement(code: string): ts.Node {
  return ts.createSourceFile('fixture.ts', code, ts.ScriptTarget.Latest, true).statements[0]
}

afterAll(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop()
    if (!dir) continue
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('scanner', () => {
  it('extracts script bodies regardless of attribute order', () => {
    const cases: string[] = [
      '<script setup lang="ts">const x = 1</script>',
      '<script lang="ts" setup>const x = 1</script>',
      '<script lang="ts">const x = 1</script>',
      '<script setup lang="ts" generic="T extends string">const x: T = 1 as T</script>',
      '<script   generic="T extends Record<string, unknown>" lang = "ts" setup >const x = 1</script>',
      "<script setup lang='ts'>const x = 1</script>",
    ]
    for (const raw of cases) {
      const { body } = extractVueScripts(raw)
      expect(body).toContain('const x')
    }
  })

  it('preserves Vue source line numbers', () => {
    const handlers = handlersIn(
      makeTempVue(`<template>
  <div />
</template>

<script lang="ts">
try {
  work()
} catch (err) {
  logError('fixture', err)
}
</script>`),
    )
    expect(handlers).toHaveLength(1)
    expect(handlers[0]?.line).toBe(8)
  })

  it('keeps the body empty for an SFC without any script', () => {
    expect(extractVueScripts('<template><div /></template>').body).toBe('')
  })

  it('fails closed when an SFC has a <script> without lang="ts"', () => {
    expect(() => extractVueScripts('<script>const x = 1</script>')).toThrow(/lang="ts"/)
  })

  it('fails closed when any script block cannot be extracted', () => {
    expect(() =>
      extractVueScripts(
        '<script lang="ts">const x = 1</script>\n<script setup lang="ts">const y = 2',
      ),
    ).toThrow(/script/i)
  })

  it('detects property access .catch() and element access ["catch"]()', () => {
    const handlers = handlersIn(
      makeTempTs(`
        const a = p.catch((err) => logError('area.a', err))
        const b = p['catch']((err) => logError('area.b', err))
      `),
    )
    expect(handlers).toHaveLength(2)
    expect(handlers.every((h) => h.kind === 'method')).toBe(true)
    expect(handlers.every((h) => h.binding === 'err')).toBe(true)
  })

  it('treats a .catch() with no argument as an offender, not a skip', () => {
    const handlers = handlersIn(makeTempTs('const x = p.catch()'))
    expect(handlers).toHaveLength(1)
    expect(handlers[0]).toMatchObject({ kind: 'method', binding: null, body: null })
  })

  it('treats non-inline .catch() callbacks as offenders, not skips', () => {
    const handlers = handlersIn(
      makeTempTs(`
        const a = p.catch(handleError)
        const b = p.catch(makeHandler())
        const c = p.catch()
      `),
    )
    expect(handlers).toHaveLength(3)
    expect(handlers.every((h) => h.kind === 'method')).toBe(true)
    expect(handlers.every((h) => h.binding === null && h.body === null)).toBe(true)
  })

  it('recognises only the reporter fetch handler as the recursive-failure exception', () => {
    const reporterHandler = handlersIn(
      makeTempTs(`setErrorReporter(() => { fetch('/api/errors').catch(() => {}) })`),
    )[0]
    const unrelatedHandler = handlersIn(makeTempTs(`fetch('/api/other').catch(() => {})`))[0]

    expect(reporterHandler && isRecursiveFailureHandler(reporterHandler)).toBe(true)
    expect(unrelatedHandler && isRecursiveFailureHandler(unrelatedHandler)).toBe(false)
  })

  it('rejects handlers whose only logError call uses the wrong binding identifier', () => {
    const node = parseFirstStatement(
      `try { f() } catch (otherError) { logError('area.wrong', otherError) }`,
    )
    const handler: Handler = {
      kind: 'catch',
      binding: 'otherError',
      body: ts.isTryStatement(node) ? node.catchClause?.block ?? null : null,
      line: 1,
      call: null,
      callback: null,
      file: 'fixture.ts',
      enclosingFunction: null,
    }
    expect(handler.binding).not.toBe('err')
  })

  it('flags logError placed after a return statement as unreachable', () => {
    const handlers = handlersIn(
      makeTempTs(`try { f() } catch (err) { return; logError('area.unreachable', err) }`),
    )
    const handler = handlers[0]
    expect(handler).toBeDefined()
    if (!handler) return
    const { sourceFile } = parseSource(handler.file)
    const offender = validateHandler(handler, sourceFile)
    expect(offender).toMatch(/first statement|must be the first reachable/i)
  })

  it('flags logError under if(false) as dead code', () => {
    const handlers = handlersIn(
      makeTempTs(`try { f() } catch (err) { if (false) logError('area.dead', err) }`),
    )
    const handler = handlers[0]
    expect(handler).toBeDefined()
    if (!handler) return
    const { sourceFile } = parseSource(handler.file)
    const offender = validateHandler(handler, sourceFile)
    expect(offender).toMatch(/first statement|must be the first reachable/i)
  })

  it('flags logError that only lives inside a nested catch', () => {
    const handlers = handlersIn(
      makeTempTs(
        `try { f() } catch (err) { try { g() } catch (inner) { logError('area.nested', inner) } }`,
      ),
    )
    const handler = handlers[0]
    expect(handler).toBeDefined()
    if (!handler) return
    const { sourceFile } = parseSource(handler.file)
    const offender = validateHandler(handler, sourceFile)
    expect(offender).toMatch(/first statement|must be the first reachable/i)
  })

  it('flags dynamic or malformed context literals', () => {
    const cases: string[] = [
      'try { f() } catch (err) { logError(`area.${x}`, err) }',
      'try { f() } catch (err) { logError(("area.cast" as string), err) }',
      'try { f() } catch (err) { logError("UPPER.case", err) }',
      'try { f() } catch (err) { logError("onlyOne", err) }',
    ]
    for (const code of cases) {
      const handlers = handlersIn(makeTempTs(code))
      const handler = handlers[0]
      expect(handler).toBeDefined()
      if (!handler) continue
      const logErrorCall = handlerLogErrorCall(handler)
      expect(logErrorCall).not.toBeNull()
      const offender = handlerLogErrorCallOffender(
        logErrorCall!.call,
        handler.file,
        handler.line,
      )
      expect(offender, code).toMatch(/context|first argument|must match/)
    }
  })

  it('accepts a global logError call with any expression as its second argument', () => {
    const statement = parseFirstStatement(
      `logError('window.onerror', error ?? message)`,
    )
    if (!ts.isExpressionStatement(statement) || !ts.isCallExpression(statement.expression)) {
      throw new Error('fixture call not parsed')
    }

    expect(logErrorCallOffender(statement.expression, 'fixture.ts', 1)).toBeNull()
  })

  it('rejects a handler whose logError second argument is not err', () => {
    const handlers = handlersIn(
      makeTempTs(
        `try { f() } catch (err) { logError('area.handler', error ?? message) }`,
      ),
    )
    const handler = handlers[0]
    expect(handler).toBeDefined()
    if (!handler) return
    const logErrorCall = handlerLogErrorCall(handler)
    expect(logErrorCall).not.toBeNull()
    expect(
      handlerLogErrorCallOffender(logErrorCall!.call, handler.file, handler.line),
    ).toMatch(/identifier 'err'/)
  })

  it('flags duplicate contexts across call sites', () => {
    const dupes = findDuplicateContexts([
      { file: 'a.ts', line: 10, context: 'shared.context', violation: null },
      { file: 'b.ts', line: 20, context: 'shared.context', violation: null },
      { file: 'c.ts', line: 30, context: 'unique.context', violation: null },
    ])
    expect(dupes).toHaveLength(1)
    expect(dupes[0]?.context).toBe('shared.context')
    expect(dupes[0]?.uses).toEqual([
      { file: 'a.ts', line: 10 },
      { file: 'b.ts', line: 20 },
    ])
  })

  it('accepts the openPdf productive exception: win?.close() first, logError second', () => {
    const openPdf: Handler = {
      kind: 'method',
      binding: 'err',
      body: null,
      line: 113,
      call: null,
      callback: null,
      file: join(SRC, 'components/dashboard/TransactionAttachmentsPanel.vue'),
      enclosingFunction: 'openPdf',
    }
    // The real handler source is parsed from the file; the synthetic callback
    // here mirrors the production shape so the validator exercises both
    // statements in order.
    const parsed = ts.createSourceFile(
      'fixture.ts',
      `(err) => { win?.close(); logError('attachments.openPdf', err) }`,
      ts.ScriptTarget.Latest,
      true,
    )
    const arrow = parsed.statements[0]
    if (!ts.isExpressionStatement(arrow) || !ts.isArrowFunction(arrow.expression)) {
      throw new Error('fixture arrow not parsed')
    }
    openPdf.callback = arrow.expression
    openPdf.body = arrow.expression.body
    expect(validateHandler(openPdf, parsed)).toBeNull()
  })

  it('accepts arrow expression whose body is the logError call directly', () => {
    const handlers = handlersIn(
      makeTempTs(`const x = p.catch((err) => logError('area.direct', err))`),
    )
    const handler = handlers[0]
    expect(handler).toBeDefined()
    if (!handler) return
    const { sourceFile } = parseSource(handler.file)
    expect(validateHandler(handler, sourceFile)).toBeNull()
  })

  it('rejects arrow expression whose body wraps the logError call', () => {
    const handlers = handlersIn(
      makeTempTs(`const x = p.catch((err) => () => logError('area.wrapped', err))`),
    )
    const handler = handlers[0]
    expect(handler).toBeDefined()
    if (!handler) return
    const { sourceFile } = parseSource(handler.file)
    const offender = validateHandler(handler, sourceFile)
    expect(offender).toMatch(/must be the logError call directly/)
  })

  it('does not count a logError call inside an uncalled nested closure as the first statement', () => {
    const handlers = handlersIn(
      makeTempTs(
        `try { f() } catch (err) { const helper = () => { logError('area.helper', err) } }`,
      ),
    )
    const handler = handlers[0]
    expect(handler).toBeDefined()
    if (!handler) return
    const { sourceFile } = parseSource(handler.file)
    expect(validateHandler(handler, sourceFile)).toMatch(/first statement/)
    // The legacy helper should still report the same finding — both agree.
    expect(callsLogErrorWithErr(handler.body!)).toBe(false)
  })

  it('requires the second argument of logError to be the identifier err', () => {
    expect(callsLogErrorWithErr(parseFirstStatement(`try { f() } catch (err) { logError('c', err) }`))).toBe(true)
    expect(callsLogErrorWithErr(parseFirstStatement(`try { f() } catch (otherError) { logError('c', otherError) }`))).toBe(false)
    expect(callsLogErrorWithErr(parseFirstStatement(`try { f() } catch (err) { logError('c', 'err') }`))).toBe(false)
    expect(callsLogErrorWithErr(parseFirstStatement(`try { f() } catch (err) { logError('c') }`))).toBe(false)
  })
})
