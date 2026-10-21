const STROKE =
  'fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"';

const ICONS = {
  folder: `<path fill="currentColor" d="M1.75 2.5h3.69c.2 0 .39.08.53.22L7.28 4h6.97c.41 0 .75.34.75.75v8.5c0 .41-.34.75-.75.75H1.75a.75.75 0 0 1-.75-.75V3.25c0-.41.34-.75.75-.75Z"/>`,
  file: `<path ${STROKE} d="M4 1.75h5.25L12.5 5v9.25H4z"/><path ${STROKE} d="M9.25 1.75V5h3.25"/>`,
  chevron: `<path ${STROKE} stroke-width="1.5" d="M6 4l4 4-4 4"/>`,
  up: `<path ${STROKE} stroke-width="1.5" d="M8 13V3M4 7l4-4 4 4"/>`,
  sidebar: `<rect ${STROKE} x="1.75" y="2.75" width="12.5" height="10.5" rx="1.5"/><path ${STROKE} d="M6 2.75v10.5"/>`,
} as const;

export type IconName = keyof typeof ICONS;

export function icon(name: IconName): SVGSVGElement {
  const template = document.createElement("template");
  template.innerHTML = `<svg class="mv-icon mv-icon-${name}" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">${ICONS[name]}</svg>`;
  return template.content.firstElementChild as SVGSVGElement;
}
