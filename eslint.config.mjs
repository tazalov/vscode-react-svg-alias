import typescriptEslint from 'typescript-eslint'
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended'

export default [
  {
    files: ['**/*.ts'],
  },
  {
    plugins: {
      '@typescript-eslint': typescriptEslint.plugin,
    },

    languageOptions: {
      parser: typescriptEslint.parser,
      ecmaVersion: 2022,
      sourceType: 'module',
    },

    rules: {
      '@typescript-eslint/naming-convention': [
        'warn',
        {
          selector: 'import',
          format: ['camelCase', 'PascalCase'],
        },
      ],

      curly: 'warn',
      eqeqeq: 'warn',
      'no-throw-literal': 'warn',
      semi: 'warn',
    },
  },
  {
    ...eslintPluginPrettier,
    rules: {
      ...eslintPluginPrettier.rules,
      'prettier/prettier': [
        'warn',
        {
          endOfLine: 'auto',
          singleQuote: true,
          semi: false,
        },
      ],
    },
  },
]
