# Mark Viewer

A Chrome extension that automatically renders local `.md` files opened via `file://` URLs as formatted HTML.

## Features

- **Automatic rendering** - open any local `.md` or `.markdown` file and it renders instantly
- **Light/dark theme** - follows your system preference via `prefers-color-scheme`
- **Syntax highlighting** - fenced code blocks with language support
- **Mermaid diagrams** - renders diagrams with pan and zoom controls
- **Raw/rendered toggle** - switch views with `Cmd+Shift+M` (Mac) / `Ctrl+Shift+M` (Windows/Linux) or click the toolbar icon
- **GitHub-inspired styling** - clean typography, tables, blockquotes, task lists, and more

## Installation

1. Clone the repository and build:

   ```sh
   git clone https://github.com/your-username/mark-viewer-ext.git
   cd mark-viewer-ext
   npm install
   npm run build
   ```

2. Load into Chrome:

   - Navigate to `chrome://extensions`
   - Enable **Developer mode** (top right)
   - Click **Load unpacked** and select the `dist/` folder

## Usage

Open any local `.md` file in Chrome (e.g. `File > Open File` or drag into the browser). The markdown is rendered automatically.

| Action | How |
|---|---|
| Toggle raw/rendered | `Cmd+Shift+M` / `Ctrl+Shift+M` |
| Toggle raw/rendered | Click the toolbar icon |

The toolbar icon shows an **MD** badge on tabs with active markdown rendering.

> **Auto-reload:** edit and save the file in any text editor and the browser view updates within ~1 second.

## Development

```sh
npm run dev      # development build with hot reload
npm run build    # production build
npx eslint src/  # lint
npx tsc --noEmit # type check
```

## Supported Languages

See [`src/content/renderer.ts`](src/content/renderer.ts) for the full list of registered syntax highlighting languages.

## License

MIT
