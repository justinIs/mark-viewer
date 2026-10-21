import mermaid from "mermaid";
import svgPanZoom from "svg-pan-zoom";
import type { Theme } from "./theme";

export function initMermaid(theme: Theme): void {
  mermaid.initialize({
    startOnLoad: false,
    theme: theme === "dark" ? "dark" : "default",
  });
}

let mermaidCounter = 0;

export function runMermaid(container: HTMLElement): void {
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

export function rerenderMermaid(container: HTMLElement, theme: Theme): void {
  initMermaid(theme);
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
