import * as vscode from 'vscode'
import { ImportParser } from './importParser'
import {
  findSvgFile,
  getMatchRange,
  isPositionInRange,
  resolvePath,
} from './utils'
import { ExtensionConfig, ImportInfo } from './types'
import {
  DEFAULT_CONFIG,
  IMPORT_PATH_REGEX,
  SUPPORTED_LANGUAGES,
} from './consts'
import { getConfig } from './config'

export class SvgDefinitionProvider implements vscode.DefinitionProvider {
  private extensionConfig: ExtensionConfig = DEFAULT_CONFIG

  constructor() {
    const config = getConfig()

    this.extensionConfig = config
  }

  public updateConfig(config: ExtensionConfig) {
    this.extensionConfig = config
  }

  async provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): Promise<vscode.Definition | null> {
    const isEnabled = this.extensionConfig.enabled
    const isSupported = SUPPORTED_LANGUAGES.includes(document.languageId)

    if (!isEnabled || !isSupported) {
      return null
    }

    if (document.getText().length > this.extensionConfig.maxFileSize) {
      return null
    }

    const imports = ImportParser.parseImports(document)

    if (imports.length === 0) {
      return null
    }

    const importDef = await this.findImportDefinition(
      document,
      position,
      imports,
    )
    if (importDef) return importDef

    return this.findComponentUsageDefinition(document, position, imports)
  }

  // Ищет определение в строке импорта — по пути или имени символа
  private async findImportDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
    imports: ImportInfo[],
  ): Promise<vscode.Definition | null> {
    const line = document.lineAt(position.line).text

    if (!line.includes('import')) {
      return null
    }

    const importsOnLine = imports.filter(
      (i) => position.line === i.startLine - 1,
    )
    if (importsOnLine.length === 0) {
      return null
    }

    for (const importInfo of importsOnLine) {
      const pathImport = this.findMatchInImportPath(line, position, importInfo)
      if (pathImport) {
        return this.resolveImportPathDefinition(
          document,
          pathImport,
          this.extensionConfig,
        )
      }

      const nameImport = this.findMatchInImportedNames(
        line,
        position,
        importInfo,
      )
      if (nameImport) {
        return this.resolveImportPathDefinition(
          document,
          nameImport,
          this.extensionConfig,
        )
      }
    }

    return null
  }

  // Проверяет, находится ли курсор на пути импорта
  private findMatchInImportPath(
    line: string,
    position: vscode.Position,
    importInfo: ImportInfo,
  ): string | null {
    const pathMatch = line.match(IMPORT_PATH_REGEX)
    if (!pathMatch) return null

    const range = getMatchRange(line, pathMatch[0], pathMatch[1])
    const isInRange = isPositionInRange(position.character, range)

    return isInRange ? importInfo.importPath : null
  }

  // Проверяет, находится ли курсор на имени импортируемого символа
  private findMatchInImportedNames(
    line: string,
    position: vscode.Position,
    importInfo: ImportInfo,
  ): string | null {
    if (importInfo.names.length === 0) return null

    for (const name of importInfo.names) {
      const match = new RegExp(`\\b${this.escapeRegExp(name)}\\b`).exec(line)
      if (!match) continue

      if (
        isPositionInRange(position.character, {
          start: match.index,
          end: match.index + name.length,
        })
      ) {
        return importInfo.importPath
      }
    }

    return null
  }

  // Ищет определение в JSX элементе — по имени компонента
  private async findComponentUsageDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
    imports: ImportInfo[],
  ): Promise<vscode.Definition | null> {
    const allComponentNames = imports.flatMap((i) => i.names)
    if (allComponentNames.length === 0) return null

    const line = document.lineAt(position.line).text
    const componentName = this.findComponentNameAtPosition(
      line,
      position,
      allComponentNames,
    )
    if (!componentName) return null

    const importInfo = imports.find((i) => i.names.includes(componentName))
    return importInfo
      ? this.resolveImportPathDefinition(
          document,
          importInfo.importPath,
          this.extensionConfig,
        )
      : null
  }

  // Находит название JSX компонента под курсором (открывающий и закрывающий тег)
  private findComponentNameAtPosition(
    line: string,
    position: vscode.Position,
    componentNames: string[],
  ): string | null {
    const escaped = componentNames.map((n) => this.escapeRegExp(n)).join('|')
    const regex = new RegExp(`</?(${escaped})\\b`, 'g')

    for (const match of line.matchAll(regex)) {
      const name = match[1]
      const nameStart = match.index! + match[0].indexOf(name)

      const isInRange = isPositionInRange(position.character, {
        start: nameStart,
        end: nameStart + name.length,
      })

      if (isInRange) {
        return name
      }
    }

    return null
  }

  // Экранирует специальные символы в регулярном выражении
  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  private async resolveImportPathDefinition(
    document: vscode.TextDocument,
    importPath: string,
    config: ExtensionConfig,
  ): Promise<vscode.Definition | null> {
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri)
    if (!workspaceFolder) {
      return null
    }

    const workspaceRoot = workspaceFolder.uri.fsPath
    const resolvedPath = resolvePath(importPath, workspaceRoot, config.aliases)
    const svgPath = await findSvgFile(resolvedPath)

    if (!svgPath) {
      return null
    }

    return new vscode.Location(
      vscode.Uri.file(svgPath),
      new vscode.Position(0, 0),
    )
  }
}
