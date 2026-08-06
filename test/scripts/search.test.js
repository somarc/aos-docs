import { expect } from '@esm-bundle/chai';
import {
  createInlineSearch,
  loadSearchIndex,
  resetSearchIndex,
  searchDocuments,
} from '../../scripts/search.js';

const documents = [
  {
    path: '/guides/pipelines',
    title: 'Compose pipeline DAGs',
    description: 'Build reviewable workflows with approvals and retries.',
    headings: ['Validate the graph', 'Run with explicit intent'],
    content: 'Pipeline YAML dependencies and durable execution.',
  },
  {
    path: '/reference/commands',
    title: 'DA CLI command families',
    description: 'Inspect command syntax and mutation boundaries.',
    headings: ['Preview and publish'],
    content: 'All executable command paths.',
  },
];

describe('First-party documentation search', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    resetSearchIndex();
  });

  it('ranks title matches ahead of body-only matches', () => {
    const results = searchDocuments(documents, 'pipeline');
    expect(results).to.have.length(1);
    expect(results[0].path).to.equal('/guides/pipelines');
  });

  it('requires every query term and searches headings', () => {
    const results = searchDocuments(documents, 'preview publish');
    expect(results).to.have.length(1);
    expect(results[0].title).to.equal('DA CLI command families');
  });

  it('loads and caches query-index data', async () => {
    let calls = 0;
    const fetchImpl = async () => {
      calls += 1;
      return { ok: true, json: async () => ({ data: documents }) };
    };
    const first = await loadSearchIndex(fetchImpl);
    const second = await loadSearchIndex(fetchImpl);
    expect(first).to.deep.equal(documents);
    expect(second).to.equal(first);
    expect(calls).to.equal(1);
  });

  it('renders results and a useful zero-results state', async () => {
    const originalFetch = window.fetch;
    window.fetch = async () => ({ ok: true, json: async () => ({ data: documents }) });
    const host = document.createElement('div');
    document.body.append(host);
    const { input, results, status } = createInlineSearch(host);

    input.value = 'pipeline';
    input.dispatchEvent(new Event('input'));
    await new Promise((resolve) => { window.setTimeout(resolve, 0); });
    expect(results.querySelectorAll('a')).to.have.length(1);
    expect(status.textContent).to.equal('1 result found.');

    input.value = 'does-not-exist';
    input.dispatchEvent(new Event('input'));
    await new Promise((resolve) => { window.setTimeout(resolve, 0); });
    expect(results.querySelectorAll('a')).to.have.length(0);
    expect(status.textContent).to.include('No results');
    window.fetch = originalFetch;
  });
});
