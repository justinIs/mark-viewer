import { pageUrl, viewerUrl } from "./fs";

// Chrome shows many code and text files as a bare <pre>. Open those in the
// code viewer instead; add #raw to the URL to keep Chrome's plain view.
function isPlainTextView(): boolean {
  const type = document.contentType;
  if (type === "text/html") return false;
  if (!type.startsWith("text/") && type !== "application/json") return false;
  return document.body?.firstElementChild?.tagName === "PRE";
}

if (location.hash !== "#raw" && isPlainTextView()) {
  // Keep any #L<line> anchor
  location.replace(viewerUrl(pageUrl()) + location.hash);
}
