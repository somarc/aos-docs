import { getConfig } from '../../scripts/nx.js';
import getSvg from '../../scripts/utils/svg.js';

const EXP_ICON = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M9.30103 6C9.30103 5.95117 9.28101 5.90479 9.2732 5.85657C9.26246 5.78931 9.26026 5.72071 9.23426 5.65686C9.1897 5.54712 9.12305 5.44434 9.03419 5.35547L4.34277 0.663087C3.9873 0.307617 3.40918 0.307617 3.05371 0.663087C2.69824 1.01856 2.69726 1.59571 3.05371 1.95215L7.10071 6L3.05371 10.0478C2.69726 10.4043 2.69824 10.9814 3.05371 11.3369C3.23144 11.5146 3.46484 11.6035 3.69824 11.6035C3.93164 11.6035 4.16504 11.5146 4.34277 11.3369L9.03418 6.64453C9.12305 6.55566 9.1897 6.45288 9.23425 6.34314C9.26025 6.2793 9.26245 6.21069 9.27319 6.14343C9.281 6.09521 9.30103 6.04883 9.30103 6Z" fill="currentColor"/>
</svg>`;

const { codeBase } = getConfig();

// Navigation is authored in DA alongside the documentation, never as a Git
// content fixture. The block consumes the rendered shared fragment.
const DOCS_NAV_PATH = `${codeBase}/fragments/nav/sitenav.plain.html`;
const DESKTOP_NAV_QUERY = '(width >= 720px)';

/** Normalize paths so extensionless content links match generated/static pages. */
function normalizePath(pathname) {
  return pathname
    .replace(/\/index\.html$/, '/')
    .replace(/\.html$/, '')
    .replace(/\/$/, '') || '/';
}

/** Compare an href to the current location by pathname only. */
function samePath(href) {
  try {
    const linkPath = normalizePath(new URL(href, window.location.origin).pathname);
    const currentPath = normalizePath(window.location.pathname);
    return linkPath === currentPath;
  } catch {
    return false;
  }
}

/** Decorate one expandable entry: add expand toggle + open state. */
function decorateEntry(li) {
  const label = li.querySelector(':scope > .api-group, :scope > a');
  const childList = li.querySelector(':scope > ul');
  if (!label || !childList || li.querySelector(':scope > .expand-tree')) return;

  const btn = document.createElement('button');
  btn.className = 'expand-tree';
  btn.innerHTML = EXP_ICON;
  const syncExpanded = () => {
    const open = li.classList.contains('is-open');
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Collapse section' : 'Expand section');
  };
  const toggle = () => {
    li.classList.toggle('is-open');
    syncExpanded();
  };
  btn.addEventListener('click', toggle);
  // A span label can't navigate, so let it toggle the section. A link label
  // (e.g. "API reference" -> /api-reference) keeps its default navigation; the
  // chevron button handles expand/collapse, and setActive() opens the section
  // when its page is the current one.
  if (label.tagName !== 'A') {
    label.addEventListener('click', toggle);
  }
  label.insertAdjacentElement('afterend', btn);

  // Expand the section containing the current page.
  if ([...childList.querySelectorAll('a')].some((a) => samePath(a.href))) {
    li.classList.add('is-open');
  }
  syncExpanded();
}

/** Highlight the matching link and keep all ancestor sections open. */
function setActive(root) {
  root.querySelectorAll('a.is-active').forEach((a) => a.classList.remove('is-active'));
  const active = [...root.querySelectorAll('a')].find((a) => samePath(a.href));
  if (!active) return;
  active.classList.add('is-active');
  let section = active.closest('li');
  while (section) {
    section.classList.add('is-open');
    const toggle = section.querySelector(':scope > .expand-tree');
    if (toggle) {
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Collapse section');
    }
    section = section.parentElement?.closest('li');
  }
}

async function fetchNav(path) {
  const resp = await fetch(path);
  if (!resp.ok) throw Error(`Could not fetch ${path}`);
  const doc = new DOMParser().parseFromString(await resp.text(), 'text/html');
  const list = doc.querySelector('ul');
  if (!list) throw Error(`${path} has no <ul>`);

  // DA's plain HTML can preserve a paragraph around a list item's only link.
  // Normalize that authoring shape so every level receives the same direct-link
  // styling, expansion control, and active-state treatment.
  list.querySelectorAll('li > p:only-child, li > p:first-child').forEach((paragraph) => {
    if (paragraph.children.length === 1 && paragraph.firstElementChild?.tagName === 'A') {
      paragraph.replaceWith(paragraph.firstElementChild);
    }
  });
  return list;
}

async function buildNavTree() {
  const docsTree = document.importNode(await fetchNav(DOCS_NAV_PATH), true);
  return docsTree;
}

function closeMobileNav() {
  document.body.classList.remove('nav-open');
  document.dispatchEvent(new CustomEvent('sitenav:close'));
}

function decorateMobileDrawer(el) {
  el.id = 'site-navigation';

  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'sitenav-close';
  close.setAttribute('aria-label', 'Close navigation menu');
  close.textContent = '×';
  close.addEventListener('click', closeMobileNav);
  el.prepend(close);

  const backdrop = document.createElement('button');
  backdrop.type = 'button';
  backdrop.className = 'sitenav-backdrop';
  backdrop.setAttribute('aria-label', 'Close navigation menu');
  backdrop.addEventListener('click', closeMobileNav);
  el.insertAdjacentElement('afterend', backdrop);

  el.addEventListener('click', (e) => {
    if (e.target.closest('a') && !window.matchMedia(DESKTOP_NAV_QUERY).matches) {
      closeMobileNav();
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('nav-open')) {
      closeMobileNav();
    }
  });
}

export default async function init(el) {
  decorateMobileDrawer(el);

  const link = document.createElement('a');
  link.href = '/';
  link.className = 'docket-brand-logo';
  link.setAttribute('aria-label', 'DA CLI documentation home');
  const svg = await getSvg({ paths: [`${codeBase}/img/logos/site.svg`] });
  link.append(svg[0]);
  const name = document.createElement('span');
  name.className = 'docket-brand-name';
  name.textContent = 'DA CLI';
  link.append(name);
  el.append(link);

  try {
    const tree = await buildNavTree();
    tree.classList.add('sitenav-tree');
    tree.querySelectorAll('li').forEach(decorateEntry);
    el.append(tree);
    setActive(tree);
  } catch (e) {
    throw Error(e);
  }
}
