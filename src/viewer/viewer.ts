// Code viewer for local files: chrome-extension://<id>/src/viewer/viewer.html?file:///path
import { fetchFile, pageUrl } from "../content/fs";
import { startPolling } from "../content/poller";
import { initTheme, createThemeSwitch } from "../content/theme";
import { initSidebar } from "../content/sidebar";
import { createBreadcrumbs } from "../content/breadcrumbs";
import { formatSize } from "../content/format";
import hljs, { languageForFile } from "../content/highlight";
import "../styles/markdown.css";
import "../styles/highlight.css";
import "../styles/sidebar.css";
import "../styles/code.css";

// Larger files are shown as plain text so highlighting doesn't stall the page
const MAX_HIGHLIGHT_BYTES = 500_000;
const MAX_RENDER_BYTES = 10_000_000;
// Bytes checked for NUL characters when deciding whether a file is binary
const BINARY_SAMPLE = 8000;

const fileUrl = pageUrl();
const fileName = decodeURIComponent(fileUrl.split("/").at(-1) ?? "");
const rawUrl = `${fileUrl}#raw`;

let lineCount = 0;

const meta = document.createElement("span");
meta.className = "mv-file-meta";
const gutter = document.createElement("div");
gutter.className = "mv-code-gutter";
gutter.setAttribute("aria-hidden", "true");
const code = document.createElement("code");
const marker = document.createElement("div");
marker.className = "mv-code-marker";
marker.hidden = true;
let currentText = "";

function countLines(text: string): number {
  const lines = text.split("\n");
  if (lines.length > 1 && lines.at(-1) === "") lines.pop();
  return lines.length;
}

function selectedLine(): number | null {
  const match = /^#L(\d+)$/.exec(location.hash);
  return match ? Number(match[1]) : null;
}

function showSelectedLine(scroll: boolean): void {
  const line = selectedLine();
  marker.hidden = line === null || line < 1 || line > lineCount;
  if (line === null || marker.hidden) return;
  marker.style.setProperty("--line", String(line - 1));
  if (scroll) marker.scrollIntoView({ block: "center" });
}

function renderCode(text: string): void {
  currentText = text;
  lineCount = countLines(text);
  const bytes = new Blob([text]).size;

  const language =
    bytes <= MAX_HIGHLIGHT_BYTES ? languageForFile(fileName) : null;
  if (language) {
    code.innerHTML = hljs.highlight(text, {
      language,
      ignoreIllegals: true,
    }).value;
  } else {
    code.textContent = text;
  }

  const numbers: string[] = [];
  for (let i = 1; i <= lineCount; i++) {
    numbers.push(`<a href="#L${i}">${i}</a>`);
  }
  gutter.innerHTML = numbers.join("");

  const details = [
    `${lineCount} ${lineCount === 1 ? "line" : "lines"}`,
    formatSize(bytes),
  ];
  if (language) details.push(language);
  meta.textContent = details.join(" · ");

  showSelectedLine(false);
}

function notice(text: string, withRawLink = true): HTMLElement {
  const el = document.createElement("div");
  el.className = "mv-file-notice";
  el.append(text);
  if (withRawLink) {
    const link = document.createElement("a");
    link.href = rawUrl;
    link.textContent = "Open the raw file";
    el.append(" ", link);
  }
  return el;
}

function headerButton(label: string, onClick: () => void): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "mv-file-action";
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}

function createHeader(): HTMLElement {
  const header = document.createElement("div");
  header.className = "mv-file-header";

  const raw = document.createElement("a");
  raw.className = "mv-file-action";
  raw.href = rawUrl;
  raw.textContent = "Raw";

  const copy = headerButton("Copy", () => {
    navigator.clipboard.writeText(currentText).then(() => {
      copy.textContent = "Copied";
      setTimeout(() => (copy.textContent = "Copy"), 1500);
    });
  });

  header.append(meta, raw, copy);
  return header;
}

async function setup(): Promise<void> {
  initTheme();
  document.title = fileName || "Mark Viewer";

  const main = document.createElement("main");
  main.className = "mv-file";
  document.body.append(main, createThemeSwitch());

  if (!fileUrl.startsWith("file:///")) {
    main.append(notice("This viewer only opens local files.", false));
    return;
  }

  main.append(createBreadcrumbs(fileUrl));
  initSidebar();

  let text: string;
  try {
    text = await fetchFile(fileUrl);
  } catch {
    main.append(notice("Couldn't read this file."));
    return;
  }

  if (text.length > MAX_RENDER_BYTES) {
    main.append(notice("This file is too large to display."));
    return;
  }
  if (text.slice(0, BINARY_SAMPLE).includes("\u0000")) {
    main.append(notice("This looks like a binary file."));
    return;
  }

  const lines = document.createElement("pre");
  lines.className = "mv-code-lines hljs";
  lines.append(code);

  const body = document.createElement("div");
  body.className = "mv-code";
  body.append(marker, gutter, lines);

  const box = document.createElement("div");
  box.className = "mv-file-box";
  box.append(createHeader(), body);
  main.append(box);

  renderCode(text);
  showSelectedLine(true);
  window.addEventListener("hashchange", () => showSelectedLine(false));

  startPolling(fileUrl, renderCode);
}

void setup();
