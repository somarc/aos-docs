import observe from '../../scripts/utils/intOb.js';

// A single, non-tabbed code panel (used by the API reference pages for JSON
// request/response examples). Mirrors the `code` block's prism usage, minus the
// tab machinery. The language comes from the `language-*` class on <code>.
const prism = import('prismjs');
const components = {};

function addCopyButton(el, text) {
  const btn = document.createElement('button');
  btn.className = 'copy-code-btn';
  btn.setAttribute('aria-label', 'Copy code');
  btn.textContent = 'Copy';
  btn.addEventListener('click', () => {
    const blob = new Blob([text], { type: 'text/plain' });
    navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
    btn.textContent = 'Copied';
    btn.classList.add('is-copied');
    setTimeout(() => {
      btn.textContent = 'Copy';
      btn.classList.remove('is-copied');
    }, 2000);
  });
  // Prefer the header bar (rendered with the title); fall back to the panel.
  (el.querySelector('.code-sample-head') ?? el).append(btn);
}

async function decorate(el) {
  await prism;

  const code = el.querySelector('code');
  if (!code) {
    el.classList.add('is-highlighted');
    return;
  }

  const cls = [...code.classList].find((c) => c.startsWith('language-'));
  const type = cls ? cls.replace('language-', '') : 'json';

  if (!components[type]) components[type] = import(`/deps/prismjs/components/prism-${type}.min.js`);
  await components[type];

  // Capture the raw text before prism wraps it in markup.
  addCopyButton(el, code.textContent);

  await new Promise((resolve) => {
    window.Prism.highlightElement(code, false, () => resolve());
  });

  el.classList.add('is-highlighted');
}

export default async function init(el) {
  observe(el, decorate);
}
