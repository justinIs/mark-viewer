import MarkdownIt from "markdown-it";
import hljs from "./highlight";

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight(str: string, lang: string): string {
    if (lang === "mermaid") {
      return `<pre class="mermaid">${md.utils.escapeHtml(str)}</pre>`;
    }
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre class="hljs"><code>${hljs.highlight(str, { language: lang }).value}</code></pre>`;
      } catch {
        // fall through
      }
    }
    return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`;
  },
});

/** GitHub-style heading anchor: "The Dashboards API" -> "the-dashboards-api" */
function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}_\- ]/gu, "")
    .replace(/ /g, "-");
}

// Give headings ids so #anchor links work, within a page and from other files
md.core.ruler.push("heading_ids", (state) => {
  const used = new Map<string, number>();
  const tokens = state.tokens;
  for (let i = 0; i < tokens.length - 1; i++) {
    const open = tokens[i];
    if (open.type !== "heading_open" || open.attrGet("id")) continue;
    const text = (tokens[i + 1].children ?? [])
      .filter((t) => t.type === "text" || t.type === "code_inline")
      .map((t) => t.content)
      .join("");
    const slug = slugify(text);
    if (!slug) continue;
    // Repeated headings get -1, -2, ... like GitHub
    const count = used.get(slug) ?? 0;
    used.set(slug, count + 1);
    open.attrSet("id", count ? `${slug}-${count}` : slug);
  }
});

export function renderMarkdown(source: string): string {
  return md.render(source);
}

/** Scrolls to the element the URL's #anchor names, once the page is rendered */
export function scrollToAnchor(container: HTMLElement): void {
  if (location.hash.length < 2) return;
  let id = location.hash.slice(1);
  try {
    id = decodeURIComponent(id);
  } catch {
    // keep the raw hash
  }
  const escaped = CSS.escape(id);
  const target =
    container.querySelector(`[id="${escaped}"]`) ??
    container.querySelector(`[id="${CSS.escape(id.toLowerCase())}"]`) ??
    container.querySelector(`a[name="${escaped}"]`);
  target?.scrollIntoView();
}
