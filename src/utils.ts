import * as path from 'path'
import * as fs from 'fs'

/**
 * Разрешает путь к импорту с учетом алиасов и базовой директории
 * @param importPath - Путь импорта для разрешения
 * @param baseDir - Базовая директория для относительных путей
 * @param aliases - Массив алиасов в формате [alias, replacement]
 * @returns нормализованный абсолютный путь
 */
export function resolvePath(
  importPath: string,
  baseDir: string,
  aliases: Array<[string, string]>,
): string {
  let resolvedPath = importPath

  // Выбираем самый длинный matching алиас (обработка пересекающихся алиасов)
  const matchedAlias = aliases
    .filter(([alias]) => importPath.startsWith(alias + '/'))
    .sort((a, b) => b[0].length - a[0].length)[0]

  if (matchedAlias) {
    const [alias, replacement] = matchedAlias
    resolvedPath = importPath.replace(alias + '/', replacement + '/')
  }

  if (!path.isAbsolute(resolvedPath)) {
    resolvedPath = path.join(baseDir, resolvedPath)
  }

  return path.normalize(resolvedPath)
}

/**
 * Проверяет существование файла
 * @param filepath - Путь к файлу для проверки
 * @returns true если файл существует, иначе false
 */
async function isFileExist(filepath: string): Promise<boolean> {
  try {
    await fs.promises.access(filepath, fs.constants.F_OK)
    return true
  } catch {
    return false
  }
}

/**
 * Ищет SVG файл по указанному пути с учетом различных вариантов расширения
 * и регистронезависимого поиска на Windows
 * @param resolvedPath - Разрешенный путь к файлу
 * @returns Найденный путь к файлу или null
 */
export async function findSvgFile(
  resolvedPath: string,
): Promise<string | null> {
  if (await isFileExist(resolvedPath)) {
    return resolvedPath
  }

  if (!resolvedPath.endsWith('.svg')) {
    const withSvg = resolvedPath + '.svg'
    if (await isFileExist(withSvg)) {
      return withSvg
    }
  }

  if (process.platform === 'win32') {
    const dir = path.dirname(resolvedPath)
    const filename = path.basename(resolvedPath)

    try {
      const files = await fs.promises.readdir(dir)
      const found = files.find(
        (f) => f.toLowerCase() === filename.toLowerCase(),
      )
      if (found) {
        return path.join(dir, found)
      }

      // Также проверяем с расширением .svg (case-insensitive)
      if (!filename.toLowerCase().endsWith('.svg')) {
        const filenameSvg = filename + '.svg'
        const foundSvg = files.find(
          (f) => f.toLowerCase() === filenameSvg.toLowerCase(),
        )
        if (foundSvg) {
          return path.join(dir, foundSvg)
        }
      }
    } catch {
      return null
    }
  }

  return null
}

/**
 * Вычисляет диапазон позиции совпадения в строке
 * @param line - Строка текста
 * @param fullMatch - Полное совпадение regex'а
 * @param matchContent - Содержимое группы совпадения (группа 1)
 * @param matchIndex - Индекс совпадения в строке (для обработки multiple matches)
 * @returns Объект с start и end позициями
 */
export function getMatchRange(
  line: string,
  fullMatch: string,
  matchContent: string,
  matchIndex?: number,
) {
  // Используем переданный индекс, или ищем в строке
  const fullMatchIndex = matchIndex ?? line.indexOf(fullMatch)
  const contentIndex = fullMatch.indexOf(matchContent)
  const start = fullMatchIndex + contentIndex
  return { start, end: start + matchContent.length }
}

/**
 * Проверяет, находится ли символ внутри диапазона
 * @param character - Позиция символа в строке
 * @param range - Диапазон для проверки
 * @returns true если символ в диапазоне
 */
export function isPositionInRange(
  character: number,
  range: { start: number; end: number },
): boolean {
  return character >= range.start && character <= range.end
}
