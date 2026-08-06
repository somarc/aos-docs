import { expect } from '@esm-bundle/chai';
import init from '../../blocks/pagenav/pagenav.js';

describe('Page navigation', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('creates deterministic links for section headings and excludes the page title', () => {
    document.body.innerHTML = '<main><h1>Page title</h1><h2>First section</h2><h3>More detail</h3><h2>First section</h2></main><nav class="pagenav"></nav>';
    const nav = document.querySelector('.pagenav');
    init(nav);

    const links = [...nav.querySelectorAll('a')];
    expect(nav.querySelector('.pagenav-title').textContent).to.equal('On this page');
    expect(links.map(({ hash }) => hash)).to.deep.equal(['#first-section', '#more-detail', '#first-section-2']);
    expect(links.some(({ textContent }) => textContent === 'Page title')).to.equal(false);
  });
});
