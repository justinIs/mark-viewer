# Mark Viewer

A Chrome extension that automatically renders local `.md` files opened via `file://` URLs as beautifully formatted HTML.

## Features

- **Automatic rendering** — open any local `.md` or `.markdown` file and it renders instantly
- **Light/dark theme** — follows your system preference via `prefers-color-scheme`
- **Syntax highlighting** — fenced code blocks with language support (20+ languages)
- **Auto-reload** — detects file changes and re-renders within ~1 second
- **Raw/rendered toggle** — switch views with `Cmd+Shift+M` (Mac) / `Ctrl+Shift+M` (Windows/Linux) or click the toolbar icon
- **GitHub-inspired styling** — clean typography, tables, blockquotes, task lists, and more

## Installation

### From source

1. Clone the repository:

   ```sh
   git clone https://github.com/your-username/mark-viewer-ext.git
   cd mark-viewer-ext
   ```

2. Install dependencies and build:

   ```sh
   npm install
   npm run build
   ```

3. Load into Chrome:

   - Navigate to `chrome://extensions`
   - Enable **Developer mode** (top right)
   - Click **Load unpacked** and select the `dist/` folder

4. **Enable file access** (required):

   - On the `chrome://extensions` page, find **Mark Viewer**
   - Click **Details**
   - Enable **Allow access to file URLs**

   Without this, the extension cannot read local markdown files.

## Usage

Open any local `.md` file in Chrome (e.g. `File > Open File` or drag into the browser). The markdown is rendered automatically.

| Action | Shortcut |
|---|---|
| Toggle raw/rendered | `Cmd+Shift+M` / `Ctrl+Shift+M` |
| Toggle raw/rendered | Click the toolbar icon |

The toolbar icon shows an **MD** badge on tabs with active markdown rendering.

### Auto-reload

Edit the `.md` file in any text editor and save — the browser view updates automatically. The extension polls the file once per second and only re-renders when the content changes.

## Development

Start a development build with hot reload:

```sh
npm run dev
```

Production build:

```sh
npm run build
```

Lint and type check:

```sh
npx eslint src/
npx tsc --noEmit
```

## Supported Languages (Syntax Highlighting)

JavaScript, TypeScript, Python, Bash, JSON, CSS, HTML/XML, Markdown, YAML, SQL, Java, Go, Rust, C/C++, Ruby, PHP, Swift, Kotlin, Diff, Shell

## Project Structure

```
src/
├── content/
│   ├── index.ts        # Entry point: extracts raw text, renders, wires up toggle/polling
│   ├── renderer.ts     # markdown-it + highlight.js configuration
│   ├── poller.ts       # Auto-reload via polling + SHA-256 hash comparison
│   └── toggle.ts       # Raw/rendered view toggle
├── background/
│   └── service-worker.ts   # Badge, toolbar click, keyboard shortcut, file fetch proxy
├── styles/
│   ├── markdown.css    # GitHub-inspired styles with CSS custom properties
│   └── highlight.css   # Syntax highlighting colors (light + dark)
└── icons/
    ├── icon-16.png
    ├── icon-48.png
    └── icon-128.png
```

## Tech Stack

- [Vite](https://vite.dev) + [@crxjs/vite-plugin](https://crxjs.dev) for building
- [TypeScript](https://www.typescriptlang.org)
- [markdown-it](https://github.com/markdown-it/markdown-it) for parsing
- [highlight.js](https://highlightjs.org) for syntax highlighting
- CSS custom properties + `prefers-color-scheme` for theming

## License

MIT
