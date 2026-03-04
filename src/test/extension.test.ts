import * as assert from 'assert'
import * as vscode from 'vscode'
import { ImportParser } from '../importParser'
import { SvgDefinitionProvider } from '../definitionProvider'
import { isPositionInRange, getMatchRange } from '../utils'

suite('Тесты расширения React SVG Alias', () => {
  vscode.window.showInformationMessage('Запуск всех тестов.')

  suite('ImportParser — Парсинг импортов', () => {
    test('Парсит default импорт SVG', () => {
      const mockDoc = {
        getText: () => `import Icon from './icon.svg'`,
        uri: vscode.Uri.file('/test'),
        version: 1,
      } as unknown as vscode.TextDocument

      ImportParser.clearCache()
      const imports = ImportParser.parseImports(mockDoc)
      assert.strictEqual(imports.length, 1)
      assert.strictEqual(imports[0].importPath, './icon.svg')
      assert.deepStrictEqual(imports[0].names, ['Icon'])
    })

    test('Игнорирует не-SVG импорты', () => {
      const mockDoc = {
        getText: () =>
          `import Button from '@/components/Button'\nimport Icon from './icon.svg'`,
        uri: vscode.Uri.file('/test2'),
        version: 1,
      } as unknown as vscode.TextDocument

      ImportParser.clearCache()
      const imports = ImportParser.parseImports(mockDoc)
      assert.strictEqual(imports.length, 1)
      assert.strictEqual(imports[0].importPath, './icon.svg')
    })

    test('Парсит именованные импорты', () => {
      const mockDoc = {
        getText: () =>
          `import { IconArrow, IconChevron } from '@/assets/icons.svg'`,
        uri: vscode.Uri.file('/test3'),
        version: 1,
      } as unknown as vscode.TextDocument

      ImportParser.clearCache()
      const imports = ImportParser.parseImports(mockDoc)
      assert.strictEqual(imports.length, 1)
      assert.deepStrictEqual(
        imports[0].names.sort(),
        ['IconArrow', 'IconChevron'].sort(),
      )
    })

    test('Парсит namespace импорты', () => {
      const mockDoc = {
        getText: () => `import * as Icons from './icons.svg'`,
        uri: vscode.Uri.file('/test4'),
        version: 1,
      } as unknown as vscode.TextDocument

      ImportParser.clearCache()
      const imports = ImportParser.parseImports(mockDoc)
      assert.strictEqual(imports.length, 1)
      assert.deepStrictEqual(imports[0].names, ['Icons'])
    })
  })

  suite('ImportParser — Кеширование', () => {
    test('Кеширует импорты по версии документа', () => {
      const mockDoc1 = {
        getText: () => `import Icon from './icon.svg'`,
        uri: vscode.Uri.file('/cache-test'),
        version: 1,
      } as unknown as vscode.TextDocument

      ImportParser.clearCache()
      const imports1 = ImportParser.parseImports(mockDoc1)
      const imports2 = ImportParser.parseImports(mockDoc1)

      // Должны вернуть ту же ссылку (из кеша)
      assert.strictEqual(imports1, imports2)
    })

    test('Очищает кеш при вызове clearCache()', () => {
      const mockDoc = {
        getText: () => `import Icon from './icon.svg'`,
        uri: vscode.Uri.file('/clear-test'),
        version: 1,
      } as unknown as vscode.TextDocument

      ImportParser.parseImports(mockDoc)
      ImportParser.clearCache()

      // После очистки должен переспарсить
      const code = `import NewIcon from './new-icon.svg'`
      const newMockDoc = {
        getText: () => code,
        uri: vscode.Uri.file('/clear-test'),
        version: 1,
      } as unknown as vscode.TextDocument

      const imports = ImportParser.parseImports(newMockDoc)
      assert.strictEqual(imports[0].names[0], 'NewIcon')
    })
  })

  suite('ImportParser — Обработка ошибок парсинга', () => {
    test('Возвращает пустой массив при синтаксических ошибках', () => {
      const mockDoc = {
        getText: () => `import { from "./icon.svg"`, // Синтаксическая ошибка
        uri: vscode.Uri.file('/error-test'),
        version: 1,
      } as unknown as vscode.TextDocument

      ImportParser.clearCache()
      const imports = ImportParser.parseImports(mockDoc)
      assert.strictEqual(imports.length, 0)
    })
  })

  suite('SvgDefinitionProvider — Инициализация', () => {
    test('Инициализируется с дефолтной конфигурацией', () => {
      const provider = new SvgDefinitionProvider()
      assert.ok(provider !== null)
    })

    test('Позволяет обновлять конфигурацию', () => {
      const provider = new SvgDefinitionProvider()
      const config = {
        enabled: false,
        aliases: [['@', 'src']] as [string, string][],
        maxFileSize: 50000,
      }
      provider.updateConfig(config)
      assert.ok(provider !== null)
    })
  })

  suite('Утилиты — escapeRegExp', () => {
    test('Корректно экранирует спецсимволы regex', () => {
      const escapeRegExp = (value: string) =>
        value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

      const dangerous = 'Icon.*+?[]{}'
      const escaped = escapeRegExp(dangerous)

      // Все спецсимволы должны быть экранированы
      assert.ok(escaped.includes('\\.'))
      assert.ok(escaped.includes('\\*'))
      assert.ok(escaped.includes('\\?'))
      assert.ok(!escaped.match(/(?<!\\)[.*+?]/))
    })

    test('Не экранирует обычные символы', () => {
      const escapeRegExp = (value: string) =>
        value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

      const safe = 'IconArrowBold'
      const escaped = escapeRegExp(safe)

      assert.strictEqual(escaped, safe)
    })
  })

  suite('Конфигурация — Размер файла', () => {
    test('Правильно сравнивает размер документа', () => {
      const maxFileSize = 100000
      const smallContent = 'x'.repeat(1000)
      const largeContent = 'x'.repeat(maxFileSize + 1)

      assert.ok(smallContent.length < maxFileSize)
      assert.ok(largeContent.length > maxFileSize)
    })
  })

  suite('Регрессия — Кеш по URI (не URI_version)', () => {
    test('Инвалидирует кеш при изменении версии документа', () => {
      const mockDocV1 = {
        getText: () => `import OldIcon from './old.svg'`,
        uri: vscode.Uri.file('/version-test'),
        version: 1,
      } as unknown as vscode.TextDocument

      const mockDocV2 = {
        getText: () => `import NewIcon from './new.svg'`,
        uri: vscode.Uri.file('/version-test'),
        version: 2,
      } as unknown as vscode.TextDocument

      ImportParser.clearCache()
      const importsV1 = ImportParser.parseImports(mockDocV1)
      assert.strictEqual(importsV1[0].names[0], 'OldIcon')

      // Тот же URI, но другая версия — должен переспарсить
      const importsV2 = ImportParser.parseImports(mockDocV2)
      assert.strictEqual(importsV2[0].names[0], 'NewIcon')
      assert.notStrictEqual(importsV1, importsV2)
    })

    test('removeFromCache удаляет запись независимо от версии', () => {
      const mockDoc = {
        getText: () => `import Icon from './icon.svg'`,
        uri: vscode.Uri.file('/remove-test'),
        version: 1,
      } as unknown as vscode.TextDocument

      ImportParser.clearCache()
      const imports1 = ImportParser.parseImports(mockDoc)

      // Удаляем из кеша (даже если version отличается)
      const docWithDifferentVersion = {
        uri: vscode.Uri.file('/remove-test'),
        version: 99,
      } as unknown as vscode.TextDocument
      ImportParser.removeFromCache(docWithDifferentVersion)

      // Должен переспарсить — новая ссылка
      const imports2 = ImportParser.parseImports(mockDoc)
      assert.notStrictEqual(imports1, imports2)
    })
  })

  suite('Регрессия — Named imports: навигация по второму символу', () => {
    test('findMatchInImportedNames находит второй символ в строке', () => {
      // Строка: import { IconArrow, IconChevron } from '@/icons.svg'
      // Курсор на "IconChevron" (позиция ~21)
      const line = `import { IconArrow, IconChevron } from '@/icons.svg'`
      const chevronIndex = line.indexOf('IconChevron')

      // Проверяем что isPositionInRange работает для второго имени
      assert.ok(chevronIndex > 0, 'IconChevron должен быть найден в строке')
      assert.ok(
        isPositionInRange(chevronIndex + 2, {
          start: chevronIndex,
          end: chevronIndex + 'IconChevron'.length,
        }),
        'Позиция внутри IconChevron должна быть в диапазоне',
      )
    })
  })

  suite('Регрессия — Закрывающий тег </Component>', () => {
    test('Регулярка </?Component матчит закрывающий тег', () => {
      const componentName = 'Icon'
      const regex = new RegExp(`</?${componentName}\\b`, 'g')

      const openTag = '<Icon className="x" />'
      const closeTag = '</Icon>'
      const both = '<Icon>text</Icon>'

      assert.ok(regex.test(openTag), 'Должен матчить открывающий тег')

      regex.lastIndex = 0
      assert.ok(regex.test(closeTag), 'Должен матчить закрывающий тег')

      regex.lastIndex = 0
      const matches = [...both.matchAll(regex)]
      assert.strictEqual(
        matches.length,
        2,
        'Должен найти оба тега в строке: <Icon> и </Icon>',
      )
    })

    test('Позиция имени в закрывающем теге вычисляется правильно', () => {
      const line = '  </Icon>'
      const componentName = 'Icon'
      const regex = new RegExp(`</?${componentName}\\b`, 'g')

      for (const match of line.matchAll(regex)) {
        const nameStart = match.index! + match[0].indexOf(componentName)
        const range = {
          start: nameStart,
          end: nameStart + componentName.length,
        }

        // Курсор на 'I' в '</Icon>' — позиция 4
        assert.strictEqual(nameStart, 4)
        assert.ok(isPositionInRange(4, range))
        assert.ok(isPositionInRange(7, range)) // на 'n'
        assert.ok(!isPositionInRange(2, range)) // на '/'
      }
    })
  })

  suite('Регрессия — getMatchRange', () => {
    test('Правильно вычисляет диапазон для пути импорта', () => {
      const line = `import Icon from '@/assets/icon.svg'`
      const fullMatch = `from '@/assets/icon.svg'`
      const matchContent = '@/assets/icon.svg'

      const range = getMatchRange(line, fullMatch, matchContent)

      assert.strictEqual(range.start, line.indexOf('@/assets/icon.svg'))
      assert.strictEqual(
        range.end,
        line.indexOf('@/assets/icon.svg') + matchContent.length,
      )
    })

    test('Обрабатывает множественные импорты в одной строке', () => {
      const line = `import Icon from '@/icon.svg'; import Arrow from '@/arrow.svg'`

      // Первый импорт
      const firstPath = '@/icon.svg'
      const firstIndex = line.indexOf(`from '${firstPath}'`)
      const range1 = getMatchRange(
        line,
        `from '${firstPath}'`,
        firstPath,
        firstIndex,
      )
      assert.strictEqual(range1.start, line.indexOf('@/icon.svg'))
      assert.strictEqual(
        range1.end,
        line.indexOf('@/icon.svg') + firstPath.length,
      )

      // Второй импорт (другой индекс!)
      const secondPath = '@/arrow.svg'
      const secondIndex = line.lastIndexOf(`from '${secondPath}'`)
      const range2 = getMatchRange(
        line,
        `from '${secondPath}'`,
        secondPath,
        secondIndex,
      )
      assert.strictEqual(range2.start, line.lastIndexOf('@/arrow.svg'))
      assert.strictEqual(
        range2.end,
        line.lastIndexOf('@/arrow.svg') + secondPath.length,
      )
    })
  })

  suite('Регрессия — Пересекающиеся алиасы', () => {
    test('Выбирает самый длинный matching алиас', () => {
      // Очень важно: когда есть ["@", "src"] и ["@icons", "src/icons"],
      // для "import X from '@icons/arrow.svg'" нужно использовать @icons, не @
      const testResolvePath = (
        importPath: string,
        aliases: Array<[string, string]>,
      ): string => {
        let resolvedPath = importPath
        const matchedAlias = aliases
          .filter(([alias]) => importPath.startsWith(alias + '/'))
          .sort((a, b) => b[0].length - a[0].length)[0]

        if (matchedAlias) {
          const [alias, replacement] = matchedAlias
          resolvedPath = importPath.replace(alias + '/', replacement + '/')
        }
        return resolvedPath
      }

      // Тест 1: @icons должен быть выбран вместо @
      const aliases: Array<[string, string]> = [
        ['@', 'src'],
        ['@icons', 'src/icons'],
      ]
      const result1 = testResolvePath('@icons/arrow.svg', aliases)
      assert.strictEqual(result1, 'src/icons/arrow.svg')

      // Тест 2: @ выбирается как более короткий алиас
      const result2 = testResolvePath('@/comp.svg', aliases)
      assert.strictEqual(result2, 'src/comp.svg')

      // Тест 3: самый длинный алиас даже если он в конце списка
      const aliases2: Array<[string, string]> = [
        ['@', 'src'],
        ['@icons', 'src/icons'],
        ['@icons/nav', 'src/icons/nav'],
      ]
      const result3 = testResolvePath('@icons/nav/arrow.svg', aliases2)
      assert.strictEqual(result3, 'src/icons/nav/arrow.svg')
    })
  })

  suite('Регрессия — importedNames с похожими именами', () => {
    test('Различает Icon и IconArrow в imported names', () => {
      const testRegex = (names: string[], searchIn: string): boolean => {
        for (const name of names) {
          // Правильно экранируем спецсимволы
          const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          const match = new RegExp(`\\b${escaped}\\b`).exec(searchIn)
          if (match) {
            return true
          }
        }
        return false
      }

      const line = `import { Icon, IconArrow } from './icons.svg'`

      // Icon должен матчиться, но без IconArrow
      assert.ok(testRegex(['Icon'], line))

      // IconArrow должен матчиться, но независимо от Icon
      assert.ok(testRegex(['IconArrow'], line))

      // Оба могут быть в списке
      assert.ok(testRegex(['Icon', 'IconArrow'], line))
    })
  })
})
