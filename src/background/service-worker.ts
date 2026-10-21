import type { DirEntry } from "../content/fs";

// Track which tabs have active markdown rendering
const activeTabs = new Set<number>();

// Chrome's file:// directory listing emits one line per entry:
// <script>addRow(name, url, isDir, size, sizeString, mtimeSeconds, dateString);</script>
const ROW_PATTERN = /<script>addRow\((.*)\);<\/script>/g;

function parseListing(html: string): DirEntry[] {
  const entries: DirEntry[] = [];
  for (const match of html.matchAll(ROW_PATTERN)) {
    try {
      // Arguments are JSON-escaped strings and numbers
      const [name, , isDir, size, , mtime] = JSON.parse(`[${match[1]}]`);
      entries.push({ name, isDir: isDir === 1, size, modified: mtime * 1000 });
    } catch {
      // skip rows we can't parse
    }
  }
  return entries;
}

function navStateKey(tabId: number): string {
  return `nav:${tabId}`;
}

function isFileUrl(url: unknown): url is string {
  return typeof url === "string" && url.startsWith("file:///");
}

// Handle messages from content scripts and the viewer page
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // Fetch file on behalf of content script (file:// CORS workaround)
  if (msg.type === "fetch-file" && isFileUrl(msg.url)) {
    fetch(msg.url)
      .then((res) => res.text())
      .then((text) => sendResponse({ text }))
      .catch((err) => sendResponse({ error: err.message }));
    return true; // keep message channel open for async response
  }

  if (msg.type === "list-dir" && isFileUrl(msg.url)) {
    fetch(msg.url)
      .then((res) => res.text())
      .then((html) => sendResponse({ entries: parseListing(html) }))
      .catch((err) => sendResponse({ error: err.message }));
    return true;
  }

  // Sidebar state is per tab so it survives navigating between files
  if (msg.type === "get-nav-state" && sender.tab?.id !== undefined) {
    const key = navStateKey(sender.tab.id);
    chrome.storage.session
      .get(key)
      .then((items) => sendResponse({ state: items[key] ?? null }))
      .catch((err) => sendResponse({ error: err.message }));
    return true;
  }

  if (msg.type === "set-nav-state" && sender.tab?.id !== undefined) {
    chrome.storage.session.set({ [navStateKey(sender.tab.id)]: msg.state });
  }

  if (msg.type === "markdown-active" && sender.tab?.id !== undefined) {
    activeTabs.add(sender.tab.id);
    chrome.action.setBadgeText({ text: "MD", tabId: sender.tab.id });
    chrome.action.setBadgeBackgroundColor({
      color: "#4A90D9",
      tabId: sender.tab.id,
    });
  }
});

// Toolbar button click -> toggle
chrome.action.onClicked.addListener((tab) => {
  if (tab.id !== undefined && activeTabs.has(tab.id)) {
    chrome.tabs.sendMessage(tab.id, { type: "toggle" });
  }
});

// Keyboard shortcut -> toggle
chrome.commands.onCommand.addListener((command, tab) => {
  if (
    command === "toggle-markdown" &&
    tab?.id !== undefined &&
    activeTabs.has(tab.id)
  ) {
    chrome.tabs.sendMessage(tab.id, { type: "toggle" });
  }
});

// Clean up when tabs close
chrome.tabs.onRemoved.addListener((tabId) => {
  activeTabs.delete(tabId);
  chrome.storage.session.remove(navStateKey(tabId));
});
