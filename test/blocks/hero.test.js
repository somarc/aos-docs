import { expect } from '@esm-bundle/chai';
import init from '../../blocks/hero/hero.js';

describe('Bounded documentation hero', () => {
  let originalMatchMedia;

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
    window.matchMedia = () => ({ matches: true });
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    document.body.innerHTML = '';
  });

  it('uses the poster while reduced motion prevents video loading', () => {
    const block = document.createElement('div');
    block.innerHTML = `<div>
      <div><h1>Operate every boundary</h1><p>Intro</p><p><a href="/start">Start</a></p></div>
      <div><p><a href="https://example.com/hero.mp4">Ambient loop</a></p><picture><img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==" alt="Authored alt"></picture></div>
    </div>`;

    init(block);

    const art = block.querySelector('.hero-art');
    const video = art.querySelector('video');
    const poster = art.querySelector('.hero-art-poster');
    const image = poster.querySelector('img');

    expect(art.classList.contains('has-video')).to.equal(true);
    expect(art.classList.contains('hero-art-placeholder')).to.equal(false);
    expect(art.querySelector('a[href$=".mp4"]')).not.to.exist;
    expect(video).to.exist;
    expect(video.querySelector('source')).not.to.exist;
    expect(video.muted).to.equal(true);
    expect(video.loop).to.equal(true);
    expect(poster.getAttribute('aria-hidden')).to.equal('true');
    expect(image.alt).to.equal('');
    expect(image.loading).to.equal('eager');
    expect(image.getAttribute('fetchpriority')).to.equal('high');
  });

  it('keeps the authored empty-cell treatment without media', () => {
    const block = document.createElement('div');
    block.innerHTML = '<div><div><h1>Operate every boundary</h1></div><div></div></div>';

    init(block);

    expect(block.querySelector('.hero-art').classList.contains('hero-art-placeholder')).to.equal(true);
  });

  it('renders a first-party query-index search field', () => {
    const block = document.createElement('div');
    block.innerHTML = '<div><div><h1>Operate every boundary</h1></div><div></div></div>';

    init(block);

    const form = block.querySelector('.site-search-inline form[role="search"]');
    const input = form.querySelector('input[type="search"]');
    expect(form).to.exist;
    expect(input.getAttribute('aria-label')).to.equal('Search the documentation');
    expect(input.placeholder).to.include('commands');
  });
});
