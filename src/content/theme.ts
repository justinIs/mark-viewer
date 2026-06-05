export type Theme = "light" | "dark";

const STORAGE_KEY = "mv-theme";

const systemDark = window.matchMedia("(prefers-color-scheme: dark)");

let current: Theme = systemDark.matches ? "dark" : "light";
let hasStoredPreference = false;
const listeners: Array<(theme: Theme) => void> = [];

function apply(theme: Theme): void {
  current = theme;
  document.documentElement.classList.toggle("mv-dark", theme === "dark");
  for (const listener of listeners) {
    listener(theme);
  }
}

export function initTheme(): void {
  apply(current);

  // Restore the user's saved preference, if any
  chrome.storage.local.get(STORAGE_KEY).then((items) => {
    const stored = items[STORAGE_KEY];
    if (stored === "light" || stored === "dark") {
      hasStoredPreference = true;
      if (stored !== current) {
        apply(stored);
      }
    }
  });

  // Follow the OS theme until the user picks one explicitly
  systemDark.addEventListener("change", (event) => {
    if (!hasStoredPreference) {
      apply(event.matches ? "dark" : "light");
    }
  });
}

export function getTheme(): Theme {
  return current;
}

export function toggleTheme(): void {
  const next: Theme = current === "dark" ? "light" : "dark";
  hasStoredPreference = true;
  apply(next);
  chrome.storage.local.set({ [STORAGE_KEY]: next });
}

export function onThemeChange(listener: (theme: Theme) => void): void {
  listeners.push(listener);
}

export function createThemeSwitch(): HTMLButtonElement {
  const button = document.createElement("button");
  button.className = "mv-theme-switch";
  button.type = "button";

  const update = (): void => {
    const label =
      current === "dark" ? "Switch to light mode" : "Switch to dark mode";
    button.textContent = current === "dark" ? "☀" : "☾";
    button.title = label;
    button.setAttribute("aria-label", label);
  };
  update();
  onThemeChange(update);

  button.addEventListener("click", toggleTheme);
  return button;
}
