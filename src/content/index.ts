import { renderMarkdown } from "./renderer";
import { startPolling } from "./poller";
import { initToggle, toggle, updateRaw } from "./toggle";
import mermaid from "mermaid";
import "../styles/markdown.css";
import "../styles/highlight.css";

const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
mermaid.initialize({ startOnLoad: false, theme: isDark ? "dark" : "default" });

let mermaidCounter = 0;

function runMermaid(container: HTMLElement): void {
  const nodes = Array.from(container.querySelectorAll<HTMLElement>("pre.mermaid"));
  for (const node of nodes) {
    const source = node.textContent ?? "";
    const id = `mermaid-${++mermaidCounter}`;
    mermaid.render(id, source).then(({ svg }) => {
      const wrapper = document.createElement("div");
      wrapper.className = "mermaid-diagram";
      wrapper.innerHTML = svg;
      node.replaceWith(wrapper);
    }).catch((err: unknown) => {
      const raw = err as { str?: string; message?: string };
      const message = raw?.str ?? raw?.message ?? String(err);
      const errorEl = document.createElement("div");
      errorEl.className = "mermaid-error";
      const label = document.createElement("p");
      label.className = "mermaid-error-label";
      label.textContent = "Mermaid diagram error";
      const pre = document.createElement("pre");
      pre.className = "mermaid-error-message";
      pre.textContent = message;
      errorEl.append(label, pre);
      node.replaceWith(errorEl);
    });
  }
}

function getMarkdownSource(): string | null {
  const pre = document.querySelector("pre");
  if (!pre) return null;
  return pre.textContent;
}

function setup(): void {
  const source = getMarkdownSource();
  if (source === null) return;

  // Clear the page
  document.body.innerHTML = "";

  // Create rendered container
  const rendered = document.createElement("article");
  rendered.className = "markdown-body";
  rendered.innerHTML = renderMarkdown(source);
  runMermaid(rendered);

  // Recreate raw container
  const rawPre = document.createElement("pre");
  rawPre.className = "markdown-raw";
  rawPre.textContent = source;

  document.body.appendChild(rendered);
  document.body.appendChild(rawPre);

  initToggle(source, rendered, rawPre);

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
    runMermaid(rendered);
    updateRaw(newContent);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setup);
} else {
  setup();
}
