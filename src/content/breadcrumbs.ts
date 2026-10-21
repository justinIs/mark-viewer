/** Path links for a file:// URL; the last segment is the current page */
export function createBreadcrumbs(url: string): HTMLElement {
  const nav = document.createElement("nav");
  nav.className = "mv-breadcrumbs";
  nav.setAttribute("aria-label", "Path");

  const segments = new URL(url).pathname.split("/").filter(Boolean);
  let href = "file:///";
  const crumbs: Array<{ label: string; href: string }> = [
    { label: "/", href },
  ];
  for (const segment of segments) {
    href += `${segment}/`;
    crumbs.push({ label: decodeURIComponent(segment), href });
  }

  crumbs.forEach((crumb, i) => {
    if (i > 1) {
      const sep = document.createElement("span");
      sep.className = "mv-breadcrumb-sep";
      sep.textContent = "/";
      nav.append(sep);
    }
    if (i === crumbs.length - 1) {
      const last = document.createElement("strong");
      last.textContent = crumb.label;
      last.setAttribute("aria-current", "page");
      nav.append(last);
    } else {
      const link = document.createElement("a");
      link.href = crumb.href;
      link.textContent = crumb.label;
      nav.append(link);
    }
  });

  return nav;
}
