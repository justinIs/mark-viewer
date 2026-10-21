import {
  listDir,
  getNavState,
  setNavState,
  sortEntries,
  entryUrl,
  parentDir,
  pageUrl,
  hrefFor,
  type DirEntry,
  type NavState,
} from "./fs";
import { icon } from "./icons";

const PREFS_KEY = "mv-sidebar";
const MIN_WIDTH = 180;
const MAX_WIDTH = 600;
// How far above a file to look for a .git directory when picking the root
const MAX_REPO_DEPTH = 10;

interface SidebarPrefs {
  open: boolean;
  width: number;
}

const prefs: SidebarPrefs = { open: true, width: 280 };

const current = pageUrl();
let root = "";
const expanded = new Set<string>();

let treeEl: HTMLElement;
let titleEl: HTMLAnchorElement;
let upButton: HTMLButtonElement;

function currentDir(): string {
  return current.endsWith("/") ? current : (parentDir(current) ?? current);
}

function displayPath(dirUrl: string): string {
  return decodeURIComponent(new URL(dirUrl).pathname);
}

function dirName(dirUrl: string): string {
  const segments = displayPath(dirUrl).split("/").filter(Boolean);
  return segments.at(-1) ?? "/";
}

// --- Root selection ---------------------------------------------------------

async function findRepoRoot(dir: string): Promise<string | null> {
  let candidate: string | null = dir;
  for (let i = 0; candidate && i < MAX_REPO_DEPTH; i++) {
    const entries = await listDir(candidate).catch((): DirEntry[] => []);
    if (entries.some((e) => e.name === ".git")) return candidate;
    candidate = parentDir(candidate);
  }
  return null;
}

async function resolveRoot(saved: NavState | null): Promise<string> {
  const dir = currentDir();
  // Keep the tab's existing root while navigating within it
  if (saved && dir.startsWith(saved.root)) return saved.root;
  // A directory opened directly becomes the root
  if (current.endsWith("/")) return dir;
  // A file opened directly: show its repository, or failing that its folder
  return (await findRepoRoot(dir)) ?? dir;
}

function expandAncestors(): void {
  let dir: string | null = currentDir();
  while (dir && dir !== root && dir.startsWith(root)) {
    expanded.add(dir);
    dir = parentDir(dir);
  }
}

function saveNavState(): void {
  setNavState({
    root,
    expanded: [...expanded].filter((url) => url.startsWith(root)),
  });
}

// --- Tree rendering ---------------------------------------------------------

function treeMessage(text: string, depth: number): HTMLLIElement {
  const li = document.createElement("li");
  li.className = "mv-tree-message";
  li.style.setProperty("--depth", String(depth));
  li.textContent = text;
  return li;
}

async function renderChildren(
  dirUrl: string,
  depth: number,
): Promise<HTMLUListElement> {
  const ul = document.createElement("ul");
  ul.className = "mv-tree-group";
  ul.setAttribute("role", depth === 0 ? "tree" : "group");

  let entries: DirEntry[];
  try {
    entries = await listDir(dirUrl);
  } catch {
    ul.append(treeMessage("Couldn't read folder", depth));
    return ul;
  }

  const visible = sortEntries(entries.filter((e) => !e.name.startsWith(".")));
  if (visible.length === 0) {
    ul.append(treeMessage("Empty", depth));
    return ul;
  }

  const items = await Promise.all(
    visible.map((entry) => renderItem(dirUrl, entry, depth)),
  );
  ul.append(...items);
  return ul;
}

async function renderItem(
  dirUrl: string,
  entry: DirEntry,
  depth: number,
): Promise<HTMLLIElement> {
  const url = entryUrl(dirUrl, entry);

  const li = document.createElement("li");
  li.className = "mv-tree-item";
  li.setAttribute("role", "treeitem");

  const row = document.createElement("div");
  row.className = "mv-tree-row";
  row.style.setProperty("--depth", String(depth));

  const link = document.createElement("a");
  link.className = "mv-tree-link";
  link.href = hrefFor(url);
  link.title = entry.name;
  if (url === current) {
    link.setAttribute("aria-current", "page");
    row.classList.add("mv-tree-current");
  }
  const name = document.createElement("span");
  name.className = "mv-tree-name";
  name.textContent = entry.name;
  link.append(icon(entry.isDir ? "folder" : "file"), name);

  if (entry.isDir) {
    const twisty = document.createElement("button");
    twisty.type = "button";
    twisty.className = "mv-tree-twisty";
    twisty.append(icon("chevron"));
    twisty.addEventListener("click", () => {
      void toggleDir(url, li, twisty, depth);
    });
    row.append(twisty, link);

    const isOpen = expanded.has(url);
    setExpandedAttrs(li, twisty, entry.name, isOpen);
    li.append(row);
    if (isOpen) {
      li.append(await renderChildren(url, depth + 1));
    }
  } else {
    const spacer = document.createElement("span");
    spacer.className = "mv-tree-twisty";
    row.append(spacer, link);
    li.append(row);
  }

  return li;
}

function setExpandedAttrs(
  li: HTMLLIElement,
  twisty: HTMLButtonElement,
  name: string,
  isOpen: boolean,
): void {
  li.setAttribute("aria-expanded", String(isOpen));
  twisty.setAttribute("aria-label", `${isOpen ? "Collapse" : "Expand"} ${name}`);
}

async function toggleDir(
  url: string,
  li: HTMLLIElement,
  twisty: HTMLButtonElement,
  depth: number,
): Promise<void> {
  const name = decodeURIComponent(url.slice(0, -1).split("/").at(-1) ?? "");
  if (expanded.has(url)) {
    expanded.delete(url);
    li.querySelector(":scope > .mv-tree-group")?.remove();
    setExpandedAttrs(li, twisty, name, false);
  } else {
    expanded.add(url);
    setExpandedAttrs(li, twisty, name, true);
    const children = await renderChildren(url, depth + 1);
    // Collapsed again while loading
    if (!expanded.has(url)) return;
    li.querySelector(":scope > .mv-tree-group")?.remove();
    li.append(children);
  }
  saveNavState();
}

async function renderTree(): Promise<void> {
  titleEl.href = root;
  titleEl.textContent = dirName(root);
  titleEl.title = displayPath(root);
  upButton.disabled = parentDir(root) === null;

  const scrollTop = treeEl.scrollTop;
  const tree = await renderChildren(root, 0);
  treeEl.replaceChildren(tree);
  treeEl.scrollTop = scrollTop;
}

function scrollToCurrent(): void {
  const row = treeEl.querySelector<HTMLElement>(".mv-tree-current");
  if (row) {
    treeEl.scrollTop = row.offsetTop - treeEl.clientHeight / 2;
  }
}

async function goUp(): Promise<void> {
  const parent = parentDir(root);
  if (!parent) return;
  expanded.add(root);
  root = parent;
  saveNavState();
  await renderTree();
}

// --- Layout preferences -----------------------------------------------------

function applyPrefs(): void {
  document.body.classList.toggle("mv-sidebar-open", prefs.open);
  document.documentElement.style.setProperty(
    "--mv-sidebar-width",
    `${prefs.width}px`,
  );
}

function savePrefs(): void {
  chrome.storage.local.set({ [PREFS_KEY]: prefs });
}

function setOpen(open: boolean): void {
  prefs.open = open;
  applyPrefs();
  savePrefs();
  // Layout was skipped while hidden, so the initial scroll had no effect
  if (open) scrollToCurrent();
}

function createResizeHandle(): HTMLElement {
  const handle = document.createElement("div");
  handle.className = "mv-sidebar-resize";
  handle.setAttribute("aria-hidden", "true");

  handle.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    handle.setPointerCapture(event.pointerId);
    document.body.classList.add("mv-resizing");

    const onMove = (move: PointerEvent): void => {
      prefs.width = Math.round(
        Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, move.clientX)),
      );
      applyPrefs();
    };
    const onUp = (): void => {
      handle.removeEventListener("pointermove", onMove);
      document.body.classList.remove("mv-resizing");
      savePrefs();
    };
    handle.addEventListener("pointermove", onMove);
    handle.addEventListener("pointerup", onUp, { once: true });
  });

  return handle;
}

function iconButton(
  className: string,
  iconName: "up" | "sidebar",
  label: string,
  onClick: () => void,
): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.title = label;
  button.setAttribute("aria-label", label);
  button.append(icon(iconName));
  button.addEventListener("click", onClick);
  return button;
}

// --- Public -----------------------------------------------------------------

/** Adds the file tree sidebar to the page */
export function initSidebar(): void {
  const sidebar = document.createElement("nav");
  sidebar.className = "mv-sidebar";
  sidebar.setAttribute("aria-label", "Files");

  const header = document.createElement("div");
  header.className = "mv-sidebar-header";
  titleEl = document.createElement("a");
  titleEl.className = "mv-sidebar-title";
  upButton = iconButton("mv-sidebar-button", "up", "Show parent folder", () => {
    void goUp();
  });
  const closeButton = iconButton(
    "mv-sidebar-button",
    "sidebar",
    "Hide sidebar",
    () => setOpen(false),
  );
  header.append(titleEl, upButton, closeButton);

  treeEl = document.createElement("div");
  treeEl.className = "mv-tree";

  sidebar.append(header, treeEl, createResizeHandle());

  const openButton = iconButton(
    "mv-sidebar-open-button",
    "sidebar",
    "Show sidebar",
    () => setOpen(true),
  );

  document.body.append(sidebar, openButton);
  applyPrefs();

  chrome.storage.local.get(PREFS_KEY).then((items) => {
    const stored = items[PREFS_KEY] as Partial<SidebarPrefs> | undefined;
    if (typeof stored?.open === "boolean") prefs.open = stored.open;
    if (typeof stored?.width === "number") prefs.width = stored.width;
    applyPrefs();
  });

  void (async () => {
    const saved = await getNavState().catch(() => null);
    root = await resolveRoot(saved);
    if (saved?.root === root) {
      for (const url of saved.expanded) expanded.add(url);
    }
    expandAncestors();
    saveNavState();
    await renderTree();
    scrollToCurrent();
  })();

  // Pick up files added or removed while the tab was in the background
  window.addEventListener("focus", () => {
    if (root) void renderTree();
  });
}
