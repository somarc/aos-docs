import { createInlineSearch } from './search.js';

function safePathname() {
  try {
    return decodeURI(window.location.pathname);
  } catch {
    return window.location.pathname;
  }
}

export default function decorateNotFound(main = document.querySelector('main')) {
  if (!main || !document.querySelector('meta[name="error-page"][content="not-found"]')) return false;

  const path = main.querySelector('.not-found-path');
  if (path) path.textContent = safePathname();

  const searchMount = main.querySelector('.not-found-search');
  if (searchMount) createInlineSearch(searchMount);
  return true;
}
