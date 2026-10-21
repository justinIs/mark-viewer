# Mark Viewer

A Chrome extension that automatically renders local `.md` files opened via `file://` URLs as formatted HTML.

## Features

- **Automatic rendering** - open any local `.md` or `.markdown` file and it renders instantly
- **File tree sidebar** - browse and jump between files in the surrounding folder or git repo
- **Folder view** - open a local directory to get a file listing with its README rendered below
- **Code viewer** - other text files open with syntax highlighting, line numbers and linkable lines
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

Open a local folder (e.g. `file:///home/you/notes/`) to get a file listing with the folder's README rendered below it.

| Action | How |
|---|---|
| Toggle raw/rendered | `Cmd+Shift+M` / `Ctrl+Shift+M` |
| Toggle raw/rendered | Click the toolbar icon |

The toolbar icon shows an **MD** badge on tabs with active markdown rendering.

### File tree sidebar

Markdown and folder pages show a file tree on the left:

- **Root** - opening a folder makes it the root. Opening a file directly uses the nearest git repository above it, or the file's own folder if there isn't one. Use the ↑ button to move the root up a level.
- **Navigation** - click a name to open it, or the chevron to expand a folder in place. The tree, root and expanded folders are remembered per tab as you navigate.
- **Layout** - drag the sidebar's right edge to resize it, or hide it with the panel button. Both are remembered.
- Dotfiles are hidden in the tree (they're still shown in the folder view).

### Code viewer

Code and other text files open in the extension's viewer page, with the same sidebar, syntax highlighting, line numbers and live reload.

- **Line links** - click a line number to highlight it; the URL (`…#L42`) links straight to that line.
- **Raw / Copy** - open the file in Chrome's plain view, or copy its contents.
- **Opening files directly** - text files Chrome would show as plain text (e.g. `file:///…/app.py`) are redirected to the viewer. Add `#raw` to the URL to skip that.
- Images, PDFs, HTML and media files open in Chrome's own viewers.

The viewer exists because Chrome downloads some text files instead of displaying them, depending on the system's MIME types (on Linux, typically `.sh`, `.yaml`, `.toml`, `.tsx`, `.sql`, `.rb`, `.php`, `.csv`). Links from the tree, folder listings and rendered markdown go through the viewer, so these files open normally. Typing their `file://` URL directly will still download them.

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
