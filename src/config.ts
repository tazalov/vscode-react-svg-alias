import * as vscode from 'vscode'
import { ExtensionConfig } from './types'

/**
 * Получение конфигурации расширения (из пользовательского конфига)
 * @returns объект конфигурации
 */
export function getConfig(): ExtensionConfig {
  const config = vscode.workspace.getConfiguration('reactSvgAlias')
  return {
    enabled: config.get<boolean>('enabled', true),
    aliases: config.get<Array<[string, string]>>('aliases', [['@', 'src']]),
    maxFileSize: config.get<number>('maxFileSize', 100000),
  }
}
