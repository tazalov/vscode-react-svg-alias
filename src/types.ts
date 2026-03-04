export interface ImportInfo {
  startLine: number
  startColumn: number
  endLine: number
  endColumn: number
  importPath: string
  names: string[]
}

export interface ExtensionConfig {
  enabled: boolean
  aliases: Array<[string, string]>
  maxFileSize: number
}
