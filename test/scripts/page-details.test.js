import { expect } from '@esm-bundle/chai';
import decoratePageDetails from '../../scripts/utils/page-details.js';

describe('Documentation page details', () => {
  beforeEach(() => {
    document.head.innerHTML = `
      <meta name="applies-to" content="DA CLI 0.6.0">
      <meta name="page-status" content="Current">
      <meta name="last-reviewed" content="2026-08-06">`;
    document.body.className = 'docs-template';
    document.body.innerHTML = '<main></main>';
  });

  afterEach(() => {
    document.head.innerHTML = '';
    document.body.className = '';
    document.body.innerHTML = '';
  });

  it('renders authored status, applicability, review date, and feedback', () => {
    const footer = decoratePageDetails();
    expect(footer.getAttribute('aria-label')).to.equal('Page details');
    expect(footer.querySelector('.doc-page-status').textContent).to.equal('Current');
    expect(footer.querySelector('.doc-applies-to').textContent).to.equal('Applies to DA CLI 0.6.0');
    expect(footer.querySelector('time').dateTime).to.equal('2026-08-06');
    expect(footer.querySelector('.doc-feedback-link').href).to.include('github.com/somarc/aos-docs/issues/new');
  });

  it('does not render on non-document templates', () => {
    document.body.className = '';
    expect(decoratePageDetails()).to.equal(null);
  });
});
