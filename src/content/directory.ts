import {
  listDir,
  fetchFile,
  sortEntries,
  entryUrl,
  parentDir,
  pageUrl,
  hrefFor,
  linkLocalFiles,
  type DirEntry,
} from "./fs";
import { renderMarkdown } from "./renderer";
import { runMermaid, rerenderMermaid } from "./mermaid";
import { startPolling } from "./poller";
import { createThemeSwitch, onThemeChange } from "./theme";
import { initSidebar } from "./sidebar";
import { icon } from "./icons";
import { createBreadcrumbs } from "./breadcrumbs";
import { formatSize, formatDate } from "./format";

const README_PATTERN = /^readme\.(md|markdown)$/i;

function listingRow(
  href: string,
  iconName: "folder" | "file" | "up",
  name: string,
  size: string,
  modified: string,
): HTMLAnchorElement {
  const row = document.createElement("a");
  row.className = "mv-listing-row";
  row.href = href;

  const nameCell = document.createElement("span");
  nameCell.className = "mv-listing-name";
  const label = document.createElement("span");
  label.textContent = name;
  nameCell.append(icon(iconName), label);

  const sizeCell = document.createElement("span");
  sizeCell.className = "mv-listing-size";
  sizeCell.textContent = size;

  const dateCell = document.createElement("span");
  dateCell.className = "mv-listing-date";
  dateCell.textContent = modified;

  row.append(nameCell, sizeCell, dateCell);
  return row;
}

function renderListing(
  container: HTMLElement,
  dirUrl: string,
  entries: DirEntry[],
): void {
  const rows: HTMLElement[] = [];

  const parent = parentDir(dirUrl);
  if (parent) {
    rows.push(listingRow(parent, "up", "..", "", ""));
  }

  for (const entry of sortEntries(entries)) {
    const row = listingRow(
      hrefFor(entryUrl(dirUrl, entry)),
      entry.isDir ? "folder" : "file",
      entry.name,
      entry.isDir ? "" : formatSize(entry.size),
      formatDate(entry.modified),
    );
    if (entry.name.startsWith(".")) row.classList.add("mv-listing-hidden");
    rows.push(row);
  }

  if (entries.length === 0) {
    const empty = document.createElement("div");
    empty.className = "mv-listing-empty";
    empty.textContent = "This folder is empty.";
    rows.push(empty);
  }

  container.replaceChildren(...rows);
}

async function renderReadme(
  section: HTMLElement,
  dirUrl: string,
  entries: DirEntry[],
): Promise<void> {
  const readme = entries.find((e) => !e.isDir && README_PATTERN.test(e.name));
  if (!readme) return;

  const url = entryUrl(dirUrl, readme);
  const source = await fetchFile(url);

  const header = document.createElement("a");
  header.className = "mv-readme-header";
  header.href = url;
  const name = document.createElement("span");
  name.textContent = readme.name;
  header.append(icon("file"), name);

  const article = document.createElement("article");
  article.className = "markdown-body";
  article.innerHTML = renderMarkdown(source);
  linkLocalFiles(article);
  runMermaid(article);

  section.replaceChildren(header, article);
  section.hidden = false;

  onThemeChange((theme) => rerenderMermaid(article, theme));
  startPolling(url, (newContent) => {
    article.innerHTML = renderMarkdown(newContent);
    linkLocalFiles(article);
    runMermaid(article);
  });
}

/** Replaces Chrome's file:// directory listing with the Mark Viewer layout */
export async function setupDirectory(): Promise<void> {
  const dirUrl = pageUrl();

  // Drop Chrome's listing styles so they don't leak into rendered content
  for (const style of document.head.querySelectorAll(
    "style:not([data-vite-dev-id])",
  )) {
    style.remove();
  }
  document.body.replaceChildren();
  document.title = decodeURIComponent(new URL(dirUrl).pathname);

  const main = document.createElement("main");
  main.className = "mv-directory";

  const listing = document.createElement("div");
  listing.className = "mv-listing";

  const readme = document.createElement("section");
  readme.className = "mv-readme";
  readme.hidden = true;

  main.append(createBreadcrumbs(dirUrl), listing, readme);
  document.body.append(main, createThemeSwitch());
  initSidebar();

  const entries = await listDir(dirUrl);
  renderListing(listing, dirUrl, entries);
  await renderReadme(readme, dirUrl, entries);

  // Pick up files added or removed while the tab was in the background
  window.addEventListener("focus", () => {
    listDir(dirUrl)
      .then((fresh) => renderListing(listing, dirUrl, fresh))
      .catch(() => {});
  });
}
