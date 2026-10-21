// File system access via the background service worker (file:// CORS workaround)

export interface DirEntry {
  name: string;
  isDir: boolean;
  size: number;
  /** Last modified time, ms since epoch */
  modified: number;
}

export interface NavState {
  /** Directory URL (trailing slash) shown at the top of the sidebar tree */
  root: string;
  /** Directory URLs currently expanded in the tree */
  expanded: string[];
}

function request<T>(message: object): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else if (response?.error) {
        reject(new Error(response.error));
      } else {
        resolve(response);
      }
    });
  });
}

export async function fetchFile(url: string): Promise<string> {
  const { text } = await request<{ text: string }>({ type: "fetch-file", url });
  return text;
}

export async function listDir(url: string): Promise<DirEntry[]> {
  const { entries } = await request<{ entries: DirEntry[] }>({
    type: "list-dir",
    url,
  });
  return entries;
}

export async function getNavState(): Promise<NavState | null> {
  const { state } = await request<{ state: NavState | null }>({
    type: "get-nav-state",
  });
  return state;
}

export function setNavState(state: NavState): void {
  chrome.runtime.sendMessage({ type: "set-nav-state", state });
}

/** Directories first, then natural name order */
export function sortEntries(entries: DirEntry[]): DirEntry[] {
  return [...entries].sort(
    (a, b) =>
      Number(b.isDir) - Number(a.isDir) ||
      a.name.localeCompare(b.name, undefined, { numeric: true }),
  );
}

export function entryUrl(dirUrl: string, entry: DirEntry): string {
  return new URL(
    encodeURIComponent(entry.name) + (entry.isDir ? "/" : ""),
    dirUrl,
  ).href;
}

export function parentDir(url: string): string | null {
  const parent = new URL(url.endsWith("/") ? ".." : ".", url).href;
  return parent === url ? null : parent;
}

const VIEWER_PATH = "src/viewer/viewer.html";

// Files Chrome already displays well on its own
const NATIVE_PATTERN =
  /\.(html?|pdf|png|jpe?g|gif|webp|avif|bmp|ico|svg|mp4|webm|mov|mp3|wav|ogg|flac|m4a)$/i;

/** The code viewer page for a file:// URL (the URL is the whole query string) */
export function viewerUrl(fileUrl: string): string {
  return `${chrome.runtime.getURL(VIEWER_PATH)}?${fileUrl}`;
}

/** Where a link to a file:// URL should point */
export function hrefFor(url: string): string {
  if (url.endsWith("/") || isMarkdown(url) || NATIVE_PATTERN.test(url)) {
    return url;
  }
  return viewerUrl(url);
}

/** Points links to local files at the right viewer, e.g. in rendered markdown */
export function linkLocalFiles(container: HTMLElement): void {
  for (const link of container.querySelectorAll<HTMLAnchorElement>("a[href]")) {
    if (link.getAttribute("href")?.startsWith("#")) continue;
    const url = new URL(link.href);
    if (url.protocol !== "file:") continue;
    const hash = url.hash;
    url.hash = "";
    link.href = hrefFor(url.href) + hash;
  }
}

/** The file:// URL this page is showing, without query or hash */
export function pageUrl(): string {
  if (location.protocol === "chrome-extension:") {
    return location.search.slice(1);
  }
  const url = new URL(location.href);
  url.search = "";
  url.hash = "";
  return url.href;
}

export function isMarkdown(name: string): boolean {
  return /\.(md|markdown)$/i.test(name);
}
