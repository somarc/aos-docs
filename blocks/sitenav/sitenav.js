import { getConfig } from '../../scripts/nx.js';
import getSvg from '../../scripts/utils/svg.js';

const EXP_ICON = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
<path d="M9.30103 6C9.30103 5.95117 9.28101 5.90479 9.2732 5.85657C9.26246 5.78931 9.26026 5.72071 9.23426 5.65686C9.1897 5.54712 9.12305 5.44434 9.03419 5.35547L4.34277 0.663087C3.9873 0.307617 3.40918 0.307617 3.05371 0.663087C2.69824 1.01856 2.69726 1.59571 3.05371 1.95215L7.10071 6L3.05371 10.0478C2.69726 10.4043 2.69824 10.9814 3.05371 11.3369C3.23144 11.5146 3.46484 11.6035 3.69824 11.6035C3.93164 11.6035 4.16504 11.5146 4.34277 11.3369L9.03418 6.64453C9.12305 6.55566 9.1897 6.45288 9.23425 6.34314C9.26025 6.2793 9.26245 6.21069 9.27319 6.14343C9.281 6.09521 9.30103 6.04883 9.30103 6Z" fill="currentColor"/>
</svg>`;

const { codeBase } = getConfig();
const DOCS_NAV_PATH = `${codeBase}/fragments/nav/sitenav.plain.html`;
const DESKTOP_NAV_QUERY = '(width >= 900px)';
const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
let disclosureId = 0;
let returnFocus = null;

function normalizePath(pathname) {
  return pathname
    .replace(/\/index\.html$/, '/')
    .replace(/\.html$/, '')
    .replace(/\/$/, '') || '/';
}

function samePath(href) {
  try {
    const linkPath = normalizePath(new URL(href, window.location.origin).pathname);
    return linkPath === normalizePath(window.location.pathname);
  } catch {
    return false;
  }
}

function setDisclosureState(li, button, childList, open) {
  li.classList.toggle('is-open', open);
  button.setAttribute('aria-expanded', String(open));
  button.setAttribute('aria-label', open ? 'Collapse section' : 'Expand section');
  childList.hidden = !open;
}

function decorateEntry(li) {
  const label = li.querySelector(':scope > .api-group, :scope > a');
  const childList = li.querySelector(':scope > ul');
  if (!label || !childList || li.querySelector(':scope > .sitenav-item')) return;

  disclosureId += 1;
  childList.id = `sitenav-section-${disclosureId}`;

  const row = document.createElement('div');
  row.className = 'sitenav-item';
  label.before(row);
  row.append(label);

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'expand-tree';
  button.setAttribute('aria-controls', childList.id);
  button.innerHTML = EXP_ICON;
  row.append(button);

  const currentBranch = [...childList.querySelectorAll('a')].some((a) => samePath(a.href));
  setDisclosureState(li, button, childList, currentBranch);

  button.addEventListener('click', () => {
    setDisclosureState(li, button, childList, !li.classList.contains('is-open'));
  });

  if (label.tagName !== 'A') {
    label.setAttribute('role', 'button');
    label.tabIndex = 0;
    const toggle = () => button.click();
    label.addEventListener('click', toggle);
    label.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggle();
      }
    });
  }
}

function setActive(root) {
  root.querySelectorAll('a.is-active').forEach((a) => {
    a.classList.remove('is-active');
    a.removeAttribute('aria-current');
  });
  const active = [...root.querySelectorAll('a')].find((a) => samePath(a.href));
  if (!active) return;
  active.classList.add('is-active');
  active.setAttribute('aria-current', 'page');

  let section = active.closest('li');
  while (section) {
    const button = section.querySelector(':scope > .sitenav-item > .expand-tree');
    const childList = section.querySelector(':scope > ul');
    if (button && childList) setDisclosureState(section, button, childList, true);
    section = section.parentElement?.closest('li');
  }
}

async function fetchNav(path) {
  const resp = await fetch(path);
  if (!resp.ok) throw Error(`Could not fetch ${path}`);
  const doc = new DOMParser().parseFromString(await resp.text(), 'text/html');
  const list = doc.querySelector('ul');
  if (!list) throw Error(`${path} has no <ul>`);

  list.querySelectorAll('li > p:only-child, li > p:first-child').forEach((paragraph) => {
    if (paragraph.children.length === 1 && paragraph.firstElementChild?.tagName === 'A') {
      paragraph.replaceWith(paragraph.firstElementChild);
    }
  });
  return list;
}

async function buildNavTree() {
  return document.importNode(await fetchNav(DOCS_NAV_PATH), true);
}

function setPageInert(inert) {
  document.querySelectorAll('header, main, footer').forEach((element) => {
    element.inert = inert;
  });
}

function syncDrawerAccessibility(el, open) {
  const mobile = !window.matchMedia(DESKTOP_NAV_QUERY).matches;
  el.setAttribute('aria-hidden', String(mobile && !open));
  if ('inert' in el) el.inert = mobile && !open;
}

function closeMobileNav(el, { restoreFocus = true } = {}) {
  const wasOpen = document.body.classList.contains('nav-open');
  document.body.classList.remove('nav-open');
  setPageInert(false);
  syncDrawerAccessibility(el, false);
  document.dispatchEvent(new CustomEvent('sitenav:close'));
  if (wasOpen && restoreFocus && returnFocus?.isConnected) returnFocus.focus();
  returnFocus = null;
}

function openMobileNav(el, trigger) {
  if (window.matchMedia(DESKTOP_NAV_QUERY).matches) return;
  returnFocus = trigger;
  document.body.classList.add('nav-open');
  syncDrawerAccessibility(el, true);
  setPageInert(true);
  el.querySelector('.sitenav-close')?.focus();
}

function trapFocus(el, event) {
  if (event.key !== 'Tab' || !document.body.classList.contains('nav-open')) return;
  const focusable = [...el.querySelectorAll(FOCUSABLE)].filter((item) => !item.closest('[hidden]'));
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function decorateMobileDrawer(el) {
  el.id = 'site-navigation';
  el.setAttribute('aria-label', 'Documentation');

  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'sitenav-close';
  close.setAttribute('aria-label', 'Close navigation menu');
  close.innerHTML = '<span aria-hidden="true">×</span>';
  close.addEventListener('click', () => closeMobileNav(el));
  el.prepend(close);

  const backdrop = document.createElement('button');
  backdrop.type = 'button';
  backdrop.className = 'sitenav-backdrop';
  backdrop.tabIndex = -1;
  backdrop.setAttribute('aria-label', 'Close navigation menu');
  backdrop.addEventListener('click', () => closeMobileNav(el));
  el.insertAdjacentElement('afterend', backdrop);

  el.addEventListener('click', (event) => {
    if (event.target.closest('a') && !window.matchMedia(DESKTOP_NAV_QUERY).matches) {
      closeMobileNav(el, { restoreFocus: false });
    }
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && document.body.classList.contains('nav-open')) {
      event.preventDefault();
      closeMobileNav(el);
    } else {
      trapFocus(el, event);
    }
  });

  const media = window.matchMedia(DESKTOP_NAV_QUERY);
  media.addEventListener('change', () => {
    closeMobileNav(el, { restoreFocus: false });
    syncDrawerAccessibility(el, false);
  });

  document.addEventListener('sitenav:open', (event) => openMobileNav(el, event.detail?.trigger));
  syncDrawerAccessibility(el, false);
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

  const tree = await buildNavTree();
  tree.classList.add('sitenav-tree');
  tree.querySelectorAll('li').forEach(decorateEntry);
  el.append(tree);
  setActive(tree);
}
