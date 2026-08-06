import { expect } from '@esm-bundle/chai';
import decorateNotFound from '../../scripts/not-found.js';

describe('Not-found recovery', () => {
  beforeEach(() => {
    document.head.innerHTML = '<meta name="error-page" content="not-found">';
    document.body.innerHTML = `<main>
      <code class="not-found-path"></code>
      <div class="not-found-search"></div>
    </main>`;
  });

  afterEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
  });

  it('renders the attempted path as text and mounts first-party search', () => {
    expect(decorateNotFound()).to.equal(true);
    expect(document.querySelector('.not-found-path').textContent).to.equal(window.location.pathname);
    expect(document.querySelector('.not-found-search input[type="search"]')).to.exist;
  });

  it('does nothing without the explicit error-page marker', () => {
    document.querySelector('meta[name="error-page"]').remove();
    expect(decorateNotFound()).to.equal(false);
  });
});
