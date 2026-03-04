import * as vscode from 'vscode'
import * as parser from '@babel/parser'
import * as t from '@babel/types'
import { ImportInfo } from './types'
import traverse from '@babel/traverse'
import { CACHE_SIZE, PARSER_OPTIONS } from './consts'

export class ImportParser {
  private static importCache: Map<
    string,
    { version: number; imports: ImportInfo[] }
  > = new Map()

  static clearCache() {
    this.importCache.clear()
  }

  static removeFromCache(document: vscode.TextDocument): void {
    this.importCache.delete(document.uri.toString())
  }

  static parseImports(document: vscode.TextDocument): ImportInfo[] {
    const cacheKey = document.uri.toString()
    const cached = this.importCache.get(cacheKey)

    if (cached && cached.version === document.version) {
      return cached.imports
    }

    const code = document.getText()

    try {
      const ast = parser.parse(code, PARSER_OPTIONS)

      const imports: ImportInfo[] = []

      traverse(ast, {
        ImportDeclaration: (path) => {
          const importPath = path.node.source.value

          if (!importPath.endsWith('.svg')) {
            return
          }

          const names: string[] = []
          const startLine = path.node.loc?.start.line || 0
          const startColumn = path.node.loc?.start.column || 0
          const endLine = path.node.loc?.end.line || 0
          const endColumn = path.node.loc?.end.column || 0

          path.node.specifiers.forEach((specifier) => {
            if (
              t.isImportDefaultSpecifier(specifier) ||
              t.isImportSpecifier(specifier) ||
              t.isImportNamespaceSpecifier(specifier)
            ) {
              names.push(specifier.local.name)
            }
          })

          if (names.length > 0) {
            imports.push({
              importPath,
              names,
              startLine,
              startColumn,
              endLine,
              endColumn,
            })
          }
        },
      })

      this.importCache.set(cacheKey, { version: document.version, imports })

      // Придерживаемся размера кеша
      if (this.importCache.size > CACHE_SIZE) {
        const firstKey = this.importCache.keys().next().value as string
        this.importCache.delete(firstKey)
      }

      return imports
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      console.debug(`[SVG Alias] Parse error for ${document.uri}: ${errorMsg}`)
      return []
    }
  }
}
