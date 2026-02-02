// Track which tabs have active markdown rendering
const activeTabs = new Set<number>();

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // Fetch file on behalf of content script (file:// CORS workaround)
  if (msg.type === "fetch-file" && msg.url) {
    fetch(msg.url)
      .then((res) => res.text())
      .then((text) => sendResponse({ text }))
      .catch((err) => sendResponse({ error: err.message }));
    return true; // keep message channel open for async response
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
});
