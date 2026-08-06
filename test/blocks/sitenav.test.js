import { expect } from '@esm-bundle/chai';
import init from '../../blocks/sitenav/sitenav.js';

const NAV_HTML = `<ul>
  <li><a href="/guides">Guides</a><ul><li><a href="/guides/pipelines">Pipelines</a></li></ul></li>
  <li><a href="/reference">Reference</a><ul><li><a href="/reference/api">Machine API</a></li></ul></li>
</ul>`;

const SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path d="M0 0h10v10H0z"/></svg>';

describe('Responsive documentation navigation', () => {
  let nav;
  let trigger;
  let originalFetch;

  before(async () => {
    originalFetch = window.fetch;
    window.fetch = async (url) => new Response(String(url).includes('sitenav') ? NAV_HTML : SVG, {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    });

    document.body.innerHTML = '<header></header><main></main><footer></footer>';
    trigger = document.createElement('button');
    trigger.textContent = 'Menu';
    document.querySelector('header').append(trigger);
    nav = document.createElement('nav');
    document.querySelector('main').before(nav);
    await init(nav);
  });

  after(() => {
    document.body.classList.remove('nav-open');
    document.body.innerHTML = '';
    window.fetch = originalFetch;
  });

  it('builds aligned label and disclosure rows', () => {
    const row = nav.querySelector('.sitenav-item');
    const button = row.querySelector('.expand-tree');
    const childList = row.parentElement.querySelector(':scope > ul');

    expect(row.children[0].tagName).to.equal('A');
    expect(row.children[1]).to.equal(button);
    expect(button.getAttribute('aria-controls')).to.equal(childList.id);
    expect(button.getAttribute('aria-expanded')).to.equal('false');
    expect(childList.hidden).to.equal(true);

    button.click();
    expect(button.getAttribute('aria-expanded')).to.equal('true');
    expect(childList.hidden).to.equal(false);
  });

  it('opens as an isolated mobile drawer and restores focus on Escape', () => {
    trigger.focus();
    document.dispatchEvent(new CustomEvent('sitenav:open', { detail: { trigger } }));

    expect(document.body.classList.contains('nav-open')).to.equal(true);
    expect(nav.getAttribute('aria-hidden')).to.equal('false');
    expect(nav.inert).to.equal(false);
    expect(document.querySelector('header').inert).to.equal(true);
    expect(document.querySelector('main').inert).to.equal(true);
    expect(document.activeElement).to.equal(nav.querySelector('.sitenav-close'));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(document.body.classList.contains('nav-open')).to.equal(false);
    expect(nav.getAttribute('aria-hidden')).to.equal('true');
    expect(nav.inert).to.equal(true);
    expect(document.querySelector('header').inert).to.equal(false);
    expect(document.activeElement).to.equal(trigger);
  });

  it('contains reverse tab navigation inside the open drawer', () => {
    document.dispatchEvent(new CustomEvent('sitenav:open', { detail: { trigger } }));
    const close = nav.querySelector('.sitenav-close');
    const visible = [...nav.querySelectorAll('a[href], button:not([disabled])')]
      .filter((item) => !item.closest('[hidden]'));
    close.focus();

    window.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    }));

    expect(document.activeElement).to.equal(visible[visible.length - 1]);
    nav.querySelector('.sitenav-close').click();
  });
});
