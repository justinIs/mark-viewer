let rawMarkdown = "";
let renderedContainer: HTMLElement | null = null;
let rawContainer: HTMLPreElement | null = null;
let isRendered = true;

export function initToggle(
  markdown: string,
  rendered: HTMLElement,
  raw: HTMLPreElement,
): void {
  rawMarkdown = markdown;
  renderedContainer = rendered;
  rawContainer = raw;
  rawContainer.style.display = "none";
  renderedContainer.style.display = "block";
  isRendered = true;
}

export function toggle(): void {
  if (!renderedContainer || !rawContainer) return;

  isRendered = !isRendered;
  if (isRendered) {
    rawContainer.style.display = "none";
    renderedContainer.style.display = "block";
  } else {
    rawContainer.style.display = "block";
    renderedContainer.style.display = "none";
  }
}

export function updateRaw(markdown: string): void {
  rawMarkdown = markdown;
  if (rawContainer) {
    rawContainer.textContent = rawMarkdown;
  }
}

export function getIsRendered(): boolean {
  return isRendered;
}
