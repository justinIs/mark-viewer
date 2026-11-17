import { renderMarkdown, scrollToAnchor } from "./renderer";
import { startPolling } from "./poller";
import { initToggle, toggle, updateRaw } from "./toggle";
import { initTheme, getTheme, onThemeChange, createThemeSwitch } from "./theme";
import { initMermaid, runMermaid, rerenderMermaid } from "./mermaid";
import { initSidebar } from "./sidebar";
import { setupDirectory } from "./directory";
import { linkLocalFiles } from "./fs";
import "../styles/markdown.css";
import "../styles/highlight.css";
import "../styles/sidebar.css";

initTheme();
initMermaid(getTheme());

function getMarkdownSource(): string | null {
  const pre = document.querySelector("pre");
  if (!pre) return null;
  return pre.textContent;
}

function setupMarkdown(): void {
  const source = getMarkdownSource();
  if (source === null) return;

  // Clear the page
  document.body.innerHTML = "";

  // Create rendered container
  const rendered = document.createElement("article");
  rendered.className = "markdown-body";
  rendered.innerHTML = renderMarkdown(source);
  linkLocalFiles(rendered);
  runMermaid(rendered);

  // Recreate raw container
  const rawPre = document.createElement("pre");
  rawPre.className = "markdown-raw";
  rawPre.textContent = source;

  document.body.appendChild(rendered);
  document.body.appendChild(rawPre);

  // Theme switch + re-render mermaid diagrams when the theme changes
  document.body.appendChild(createThemeSwitch());
  onThemeChange((theme) => rerenderMermaid(rendered, theme));
  initSidebar();

  initToggle(source, rendered, rawPre);

  // The headings didn't exist when Chrome loaded the page, so jump to the
  // #anchor ourselves
  scrollToAnchor(rendered);

  // Notify background we're on a markdown page
  chrome.runtime.sendMessage({ type: "markdown-active" });

  // Listen for toggle messages from background
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "toggle") {
      toggle();
    }
  });

  // Start polling for changes
  startPolling(location.href, (newContent) => {
    rendered.innerHTML = renderMarkdown(newContent);
    linkLocalFiles(rendered);
    runMermaid(rendered);
    updateRaw(newContent);
  });
}

function setup(): void {
  // Directory URLs end in a slash; everything else matched is a markdown file
  if (location.pathname.endsWith("/")) {
    void setupDirectory();
  } else {
    setupMarkdown();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setup);
} else {
  setup();
}
