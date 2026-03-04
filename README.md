# 🎯 React SVG Alias

A VS Code extension that enables seamless **Ctrl+Click navigation** to SVG files imported with **path aliases** in JSX/TSX components.

## ✨ Features

- 🎨 **JSX/TSX Component Navigation** — navigate from `<IconArrow />` directly to the SVG file
- ⚡ **Performance optimized** — file size limits and smart caching prevent slowdowns
- 🛡️ **Path alias support** — works with path aliases (`@/assets`, `@icons`, `~`, etc.)
- 🔄 **Hot config reload** — VS Code settings changes apply instantly
- 📦 **Babel-powered parsing** — robust import detection using Babel parser

## ⚡ Installation

1. Go to the [Open VSX](https://open-vsx.org/extension/tazalov/react-svg-alias) and download the extension (`.vsix` file).
2. Open Visual Studio Code.
3. Press `F1` or `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (macOS)
4. Type and select *"Extensions: Install from VSIX..."*
5. In the file explorer that opens, navigate to the location where you downloaded the `.vsix` file.
6. Select the file and click *"Install"*.
7. Wait for the installation to complete. Once finished, you will see a notification confirming that the extension has been installed.

## 🚀 Quick Start

1. **Install** the extension
2. **Configure** your aliases in VS Code settings (match your `jsconfig.json/tsconfig.json`)
3. **Navigate to SVG definition** using one of:
   - **`Ctrl+Click`** (Cmd+Click on macOS) on import path or component name
   - **`F12`** — VS Code's standard Go to Definition (when cursor on import/component)
   - **Right-click menu** → `Go to Definition` — context menu option

## 📝 Important: What This Extension Does Do

### ✅ Works With

**Imports with path aliases:**
```typescript
import Icon from '@/assets/icons/arrow.svg'
import { ChevronIcon } from '@icons/navigation.svg'
import * as Icons from '~/svg/icons.svg'
```

**JSX/TSX component usage:**
```typescript
<IconArrow />     // ← Ctrl+Click on tag name
<Icon className="my-icon" />  // ← Works with props too
```

## 📚 Supported Import Patterns

### 1️⃣ Default Import with Alias

```typescript
// @ alias pointing to src/
import Icon from '@/assets/icons/arrow.svg'

// Custom @icons alias
import ChevronIcon from '@icons/chevron.svg'

// ~ alias (root-relative)
import ArrowIcon from '~/svg/arrow.svg'
```

### 2️⃣ Named Import with Alias

```typescript
// Single import
import { ArrowIcon } from '@/assets/icons.svg'

// Multiple from same file
import { ArrowIcon, ChevronIcon, CrossIcon } from '@icons/bundle.svg'
```

### 3️⃣ Named Import with Renaming

```typescript
// Multiple with renaming
import { 
  PrimaryIcon as MainIcon, 
  SecondaryIcon as AltIcon 
} from '@icons/dashboard.svg'
```

### 4️⃣ Namespace Import with Alias

```typescript
// Import entire namespace
import * as Icons from '@/assets/icons.svg'

// Root-relative
import * as UtilityIcons from '~/svg/icons.svg'
```

### 5️⃣ JSX/TSX Component Usage (The Star Feature!)

**This is what makes this extension valuable** — jump from component usage to SVG definition:

```typescript
// Import SVG with alias
import Icon from '@/assets/icons/arrow.svg'
import { ChevronIcon } from '@icons/navigation.svg'
import * as DashboardIcons from '@icons/dashboard.svg'

function MyComponent() {
  return (
    <div>
      {/* Ctrl+Click on "Icon" tag name → opens @/assets/icons/arrow.svg */}
      <Icon className="icon-small" />
      
      {/* Ctrl+Click on "ChevronIcon" → opens @icons/navigation.svg */}
      <ChevronIcon direction="down" />
      
      {/* With children */}
      <Icon>
        <span>Content</span>
      </Icon>
      
      {/* Namespace usage */}
      <DashboardIcons.ArrowIcon />
    </div>
  )
}
```

### 📦 Path Alias Configuration

#### Step 1: Configure in `jsconfig.json/tsconfig.json`

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@icons/*": ["src/assets/icons/*"],
      "@app/*": ["src/app/*"],
      "~/*": ["./*"]
    }
  }
}
```

#### Step 2: Configure in VS Code `settings.json`

```json
{
  "reactSvgAlias.enabled": true,
  "reactSvgAlias.aliases": [
    ["@", "src"],
    ["@icons", "src/assets/icons"],
    ["@app", "src/app"],
    ["~", "."]
  ],
  "reactSvgAlias.maxFileSize": 100000
}
```

#### Step 3: Use in code

```typescript
import Icon from '@/assets/icons/arrow.svg'     // @ → src
import Nav from '@icons/navigation.svg'          // @icons → src/assets/icons
import Logo from '@app/logo.svg'                 // @app → src/app
import Root from '~/config.svg'                  // ~ → .
```

## ⚙️ Configuration Reference

### Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `enabled` | boolean | `true` | Enable/disable the extension |
| `aliases` | `[string, string][]` | `[["@", "src"]]` | Array of `[alias, target]` pairs |
| `maxFileSize` | number | `100000` | Max file size (bytes) to parse; larger files are skipped |

### Alias Format

Each alias is a pair: `[alias, replacement]`

```json
"reactSvgAlias.aliases": [
  ["@", "src"],              // @ → src/
  ["@icons", "src/icons"],   // @icons → src/icons/
  ["~", "."]                 // ~ → root
]
```

> **Important**: Do **not** add `*`, `/` or glob patterns to alias values.  
> Write `["@", "src"]` — not `["@/*", "src/*"]` or `["@/", "src/"]`.  
> Slashes are added automatically during path resolution.

> **Tip**: Keep this in sync with your `tsconfig.json` `paths` configuration.

### Recommended VS Code Settings

For the best user experience, add this to your VS Code `settings.json`:

```json
{
  "editor.gotoLocation.multipleDefinitions": "goto"
}
```

**Why?** If your extension finds multiple potential definitions, this setting makes VS Code automatically go to the first one instead of showing a picker dialog. This provides a seamless navigation experience.

## 🔧 Requirements

- VS Code **1.109.0** or higher

## 🆘 Troubleshooting

### Navigation not working?

1. **Extension enabled?** Check `reactSvgAlias.enabled = true`
2. **Using aliases?** This extension is for **alias paths** (`@/`, `@icons/`)
   - For **relative imports** (`./`, `../`), VS Code handles them automatically
3. **Aliases configured?** Verify `reactSvgAlias.aliases` matches `tsconfig.json`
4. **File not found?** Check the resolved path is correct
5. **File too large?** Increase `maxFileSize` if needed

### Cache out of sync?

- Run command: Open command palette (`Ctrl+Shift+P` or `Cmd+Shift+P`), then type and select `React SVG Alias: Clear Cache`
- Or restart VS Code

## 🤝 Contributing

Found a bug? Have a feature request? [Open an issue](https://github.com/tazalov/vscode-react-svg-alias/issues)

## 📝 License

MIT

**Enjoy!** 🎉
