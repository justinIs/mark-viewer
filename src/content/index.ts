import { renderMarkdown } from "./renderer";
import { startPolling } from "./poller";
import { initToggle, toggle, updateRaw } from "./toggle";
import "../styles/markdown.css";
import "../styles/highlight.css";

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
    updateRaw(newContent);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setup);
} else {
  setup();
}
