import * as vscode from 'vscode'
import { SvgDefinitionProvider } from './definitionProvider'
import { ImportParser } from './importParser'
import { getConfig } from './config'
import { SUPPORTED_LANGUAGES } from './consts'

export function activate(context: vscode.ExtensionContext) {
  console.log('[SVG Alias] Расширение активировано!')

  const definitionProvider = new SvgDefinitionProvider()

  SUPPORTED_LANGUAGES.forEach((language) => {
    context.subscriptions.push(
      vscode.languages.registerDefinitionProvider(
        { language },
        definitionProvider,
      ),
    )
  })

  const configChangeDisposable = vscode.workspace.onDidChangeConfiguration(
    (e) => {
      if (e.affectsConfiguration('reactSvgAlias')) {
        ImportParser.clearCache()
        const newConfig = getConfig()
        definitionProvider.updateConfig(newConfig)
        console.log(
          '[SVG Alias] Конфигурация изменена — кеш очищен, конфиг обновлён',
        )
      }
    },
  )

  context.subscriptions.push(configChangeDisposable)

  const closeDocumentDisposable = vscode.workspace.onDidCloseTextDocument(
    (document) => {
      ImportParser.removeFromCache(document)
    },
  )

  context.subscriptions.push(closeDocumentDisposable)

  const clearCacheCommand = vscode.commands.registerCommand(
    'reactSvgAlias.clearCache',
    () => {
      ImportParser.clearCache()
      vscode.window.showInformationMessage(
        '[SVG Alias] Cache cleared successfully!',
      )
      console.log('[SVG Alias] Manual cache clear executed')
    },
  )

  context.subscriptions.push(clearCacheCommand)
}

export function deactivate() {}
