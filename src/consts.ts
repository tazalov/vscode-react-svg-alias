import { ParserOptions } from '@babel/parser'
import { ExtensionConfig } from './types'

// Регулярка для парсинга пути из импорта
export const IMPORT_PATH_REGEX = /from\s+['"]([^'"]+)['"]/
// Паттерн для определения SVG импорта (включая query-параметры: ?react, ?component и т.д.)
export const SVG_IMPORT_PATTERN = /\.svg(\?\w+)?$/
// Размер кеша
export const CACHE_SIZE = 50
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
