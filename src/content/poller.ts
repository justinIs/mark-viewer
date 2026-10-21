import { fetchFile } from "./fs";

const POLL_INTERVAL = 1000;

let lastHash: string | null = null;
let timerId: ReturnType<typeof setInterval> | null = null;

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function startPolling(
  url: string,
  onChanged: (newContent: string) => void,
): void {
  stopPolling();

  const poll = async () => {
    try {
      const text = await fetchFile(url);
      const hash = await sha256(text);
      if (lastHash !== null && hash !== lastHash) {
        onChanged(text);
      }
      lastHash = hash;
    } catch {
      // file may be mid-save or service worker waking up, ignore
    }
  };

  poll();
  timerId = setInterval(poll, POLL_INTERVAL);
}

export function stopPolling(): void {
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
  }
}
