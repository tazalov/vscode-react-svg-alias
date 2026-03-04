import { ParserOptions } from '@babel/parser'
import { ExtensionConfig } from './types'

// Регулярка для парсинга пути из импорта
export const IMPORT_PATH_REGEX = /from\s+['"]([^'"]+)['"]/
// Размер кеша
export const CACHE_SIZE = 10
// Дефолтные значения для конфигурации
export const DEFAULT_CONFIG: ExtensionConfig = {
  enabled: true,
  maxFileSize: 100000,
  aliases: [['@', 'src']],
}
// Поддерживаемые языки для обработки
export const SUPPORTED_LANGUAGES = [
  'javascript',
  'javascriptreact',
  'typescript',
  'typescriptreact',
]
// Опции парсера Babel
export const PARSER_OPTIONS: ParserOptions = {
  sourceType: 'module' as const,
  plugins: ['typescript', 'jsx'],
}
