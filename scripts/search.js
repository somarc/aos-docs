const INDEX_PATH = '/query-index.json';
const RESULT_LIMIT = 8;
const INDEX_PAGE_SIZE = 200;
const FAILURE_CACHE_MS = 30000;

let indexPromise;
let indexFailure;
let indexFailureUntil = 0;
let globalDialog;
let keyboardInstalled = false;
let formCount = 0;

function text(value) {
  if (Array.isArray(value)) return value.join(' ');
  return String(value || '');
}

function normalized(value) {
  return text(value).toLocaleLowerCase().replace(/\s+/g, ' ').trim();
}

function resultPath(entry) {
  try {
    const url = new URL(entry.path || entry.url || '/', window.location.origin);
    if (!['http:', 'https:'].includes(url.protocol) || url.origin !== window.location.origin) {
      return null;
    }
    return url.pathname.replace(/\.html$/, '') || '/';
  } catch {
    return null;
  }
}

export function searchDocuments(documents, query, limit = RESULT_LIMIT) {
  const terms = normalized(query).split(' ').filter(Boolean);
  if (!terms.length) return [];

  return documents
    .map((entry) => {
      const safePath = resultPath(entry);
      if (!safePath) return null;
      const title = normalized(entry.title);
      const description = normalized(entry.description);
      const headings = normalized(entry.headings);
      const content = normalized(entry.content);
      const path = normalized(safePath);
      const all = `${title} ${description} ${headings} ${content} ${path}`;
      if (!terms.every((term) => all.includes(term))) return null;

      const phrase = terms.join(' ');
      let score = title === phrase ? 240 : 0;
      if (title.includes(phrase)) score += 120;
      if (headings.includes(phrase)) score += 70;
      if (description.includes(phrase)) score += 45;
      terms.forEach((term) => {
        if (title.includes(term)) score += 28;
        if (headings.includes(term)) score += 16;
        if (description.includes(term)) score += 10;
        if (path.includes(term)) score += 6;
        if (content.includes(term)) score += 2;
      });
      return { ...entry, path: safePath, score };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || text(a.title).localeCompare(text(b.title)))
    .slice(0, limit);
}

export function resetSearchIndex() {
  indexPromise = undefined;
  indexFailure = undefined;
  indexFailureUntil = 0;
}

export async function loadSearchIndex(fetchImpl = window.fetch.bind(window)) {
  if (indexFailure && Date.now() < indexFailureUntil) throw indexFailure;
  if (!indexPromise) {
    indexPromise = (async () => {
      const documents = [];
      let offset = 0;
      let total;
      do {
        const url = `${INDEX_PATH}?limit=${INDEX_PAGE_SIZE}&offset=${offset}`;
        const response = await fetchImpl(url, { credentials: 'same-origin' });
        if (!response.ok) throw new Error(`Search index unavailable (${response.status})`);
        const payload = await response.json();
        const page = Array.isArray(payload) ? payload : payload.data || [];
        documents.push(...page);
        total = Number.isFinite(payload.total) ? payload.total : undefined;
        offset += page.length;
        if (page.length < INDEX_PAGE_SIZE || (total !== undefined && offset >= total)) break;
      } while (offset < 10000);
      indexFailure = undefined;
      indexFailureUntil = 0;
      return documents;
    })()
      .catch((error) => {
        indexPromise = undefined;
        indexFailure = error;
        indexFailureUntil = Date.now() + FAILURE_CACHE_MS;
        throw error;
      });
  }
  return indexPromise;
}

function ensureStyles() {
  if (document.querySelector('link[href="/styles/search.css"]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/styles/search.css';
  document.head.append(link);
}

function resultMarkup(result) {
  const item = document.createElement('li');
  item.className = 'site-search-result';
  const link = document.createElement('a');
  link.href = result.path;
  const title = document.createElement('strong');
  title.textContent = text(result.title) || result.path;
  const description = document.createElement('span');
  description.textContent = text(result.description) || result.path;
  link.append(title, description);
  item.append(link);
  return item;
}

function buildSearchForm({ compact = false } = {}) {
  formCount += 1;
  const inputId = `site-search-input-${formCount}`;
  const resultsId = `site-search-results-${formCount}`;
  const form = document.createElement('form');
  form.className = `site-search-form${compact ? ' site-search-form-compact' : ''}`;
  form.setAttribute('role', 'search');
  const label = document.createElement('label');
  label.className = 'site-search-label';
  label.htmlFor = inputId;
  label.textContent = 'Search the documentation';
  const field = document.createElement('div');
  field.className = 'site-search-field';
  const icon = document.createElement('span');
  icon.className = 'site-search-icon';
  icon.setAttribute('aria-hidden', 'true');
  const input = document.createElement('input');
  input.type = 'search';
  input.id = inputId;
  input.name = 'q';
  input.placeholder = 'Search commands, guides, and recipes';
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.setAttribute('aria-label', 'Search the documentation');
  input.setAttribute('aria-controls', resultsId);
  const shortcut = document.createElement('kbd');
  shortcut.textContent = navigator.platform.includes('Mac') ? '⌘K' : 'Ctrl K';
  field.append(icon, input, shortcut);
  const status = document.createElement('p');
  status.className = 'site-search-status';
  status.setAttribute('aria-live', 'polite');
  const results = document.createElement('ul');
  results.className = 'site-search-results';
  results.id = resultsId;
  results.hidden = true;

  let request = 0;
  const render = async () => {
    request += 1;
    const current = request;
    const query = input.value.trim();
    results.replaceChildren();
    if (query.length < 2) {
      results.hidden = true;
      status.textContent = query ? 'Type at least two characters.' : '';
      return;
    }
    status.textContent = 'Searching…';
    try {
      const documents = await loadSearchIndex();
      if (current !== request) return;
      const matches = searchDocuments(documents, query);
      matches.forEach((result) => results.append(resultMarkup(result)));
      results.hidden = false;
      status.textContent = matches.length
        ? `${matches.length} result${matches.length === 1 ? '' : 's'} found.`
        : `No results for “${query}”.`;
    } catch {
      if (current !== request) return;
      results.hidden = true;
      status.textContent = 'Search is temporarily unavailable.';
    }
  };

  input.addEventListener('input', render);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown') {
      const first = results.querySelector('a');
      if (first) {
        event.preventDefault();
        first.focus();
      }
    } else if (event.key === 'Escape') {
      input.value = '';
      render();
    }
  });
  results.addEventListener('keydown', (event) => {
    const links = [...results.querySelectorAll('a')];
    const index = links.indexOf(document.activeElement);
    if (event.key === 'ArrowDown' && links[index + 1]) {
      event.preventDefault();
      links[index + 1].focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (links[index - 1]) links[index - 1].focus();
      else input.focus();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      const dialog = form.closest('dialog');
      if (dialog?.open) dialog.close();
      else input.focus();
    }
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    results.querySelector('a')?.click();
  });
  form.append(label, field, status, results);
  return { form, input, results, status };
}

export function createInlineSearch(container) {
  ensureStyles();
  const search = document.createElement('div');
  search.className = 'site-search site-search-inline';
  const parts = buildSearchForm({ compact: true });
  search.append(parts.form);
  container.append(search);
  return parts;
}

function createDialog() {
  ensureStyles();
  const dialog = document.createElement('dialog');
  dialog.className = 'site-search-dialog';
  dialog.setAttribute('aria-labelledby', 'site-search-title');
  const header = document.createElement('div');
  header.className = 'site-search-dialog-header';
  const title = document.createElement('h2');
  title.id = 'site-search-title';
  title.textContent = 'Search documentation';
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'site-search-close';
  close.setAttribute('aria-label', 'Close search');
  close.textContent = '×';
  close.addEventListener('click', () => dialog.close());
  header.append(title, close);
  const parts = buildSearchForm();
  dialog.append(header, parts.form);
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => dialog.returnFocus?.focus());
  dialog.searchInput = parts.input;
  document.body.append(dialog);
  return dialog;
}

export function openSiteSearch(trigger) {
  const inline = document.querySelector('.site-search-inline input');
  if (inline && inline.getClientRects().length) {
    inline.focus();
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    inline.scrollIntoView({ block: 'center', behavior: reducedMotion ? 'auto' : 'smooth' });
    return;
  }
  if (!globalDialog) globalDialog = createDialog();
  globalDialog.returnFocus = trigger || document.activeElement;
  if (!globalDialog.open) globalDialog.showModal();
  globalDialog.searchInput.focus();
}

function installKeyboardShortcut() {
  if (keyboardInstalled) return;
  keyboardInstalled = true;
  document.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === 'k') {
      const editable = event.target.closest?.('input, textarea, select, [contenteditable="true"]');
      if (editable) return;
      event.preventDefault();
      openSiteSearch();
    }
  });
}

export function createSearchTrigger(container) {
  ensureStyles();
  installKeyboardShortcut();
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'site-search-trigger';
  button.setAttribute('aria-label', 'Search documentation');
  const shortcut = navigator.platform.includes('Mac') ? '⌘K' : 'Ctrl K';
  button.innerHTML = `<span class="site-search-icon" aria-hidden="true"></span><span>Search</span><kbd>${shortcut}</kbd>`;
  button.addEventListener('click', () => openSiteSearch(button));
  container.append(button);
  return button;
}
