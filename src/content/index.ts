import { renderMarkdown } from "./renderer";
import { startPolling } from "./poller";
import { initToggle, toggle, updateRaw } from "./toggle";
import {
  initTheme,
  getTheme,
  onThemeChange,
  createThemeSwitch,
  type Theme,
} from "./theme";
import mermaid from "mermaid";
import svgPanZoom from "svg-pan-zoom";
import "../styles/markdown.css";
import "../styles/highlight.css";

initTheme();
mermaid.initialize({
  startOnLoad: false,
  theme: getTheme() === "dark" ? "dark" : "default",
});

let mermaidCounter = 0;

function runMermaid(container: HTMLElement): void {
  const nodes = Array.from(container.querySelectorAll<HTMLElement>("pre.mermaid"));
  for (const node of nodes) {
    const source = node.textContent ?? "";
    const id = `mermaid-${++mermaidCounter}`;
    mermaid.render(id, source).then(({ svg }) => {
      const wrapper = document.createElement("div");
      wrapper.className = "mermaid-diagram";
      wrapper.dataset.mermaidSource = source;
      wrapper.innerHTML = svg;
      node.replaceWith(wrapper);

      const svgEl = wrapper.querySelector("svg");
      if (svgEl) {
        svgEl.removeAttribute("style");
        svgEl.setAttribute("width", "100%");
        svgEl.setAttribute("height", "100%");
        svgPanZoom(svgEl, {
          controlIconsEnabled: true,
          fit: true,
          center: true,
          minZoom: 0.1,
          maxZoom: 20,
        });
      }
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

function rerenderMermaid(container: HTMLElement, theme: Theme): void {
  mermaid.initialize({
    startOnLoad: false,
    theme: theme === "dark" ? "dark" : "default",
  });
  const diagrams = Array.from(
    container.querySelectorAll<HTMLElement>(".mermaid-diagram"),
  );
  for (const diagram of diagrams) {
    const source = diagram.dataset.mermaidSource;
    if (source === undefined) continue;
    const pre = document.createElement("pre");
    pre.className = "mermaid";
    pre.textContent = source;
    diagram.replaceWith(pre);
  }
  runMermaid(container);
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

  // Theme switch + re-render mermaid diagrams when the theme changes
  document.body.appendChild(createThemeSwitch());
  onThemeChange((theme) => rerenderMermaid(rendered, theme));

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
