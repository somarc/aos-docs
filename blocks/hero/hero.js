import { createInlineSearch } from '../../scripts/search.js';

/**
 * Hero block — eyebrow, title, intro, CTAs (+ optional search) on the left,
 * an illustration on the right.
 *
 * Content model (block table, 2 columns):
 *   | Hero | |
 *   | ---- | --- |
 *   | `Documentation` ### Title \n intro \n [Primary](/x) [Secondary](/y) |
 *   | [video](/media/loop.mp4) \n ![poster](/media/poster.webp) |
 *
 * The copy cell holds: an optional eyebrow (inline code or emphasis as the
 * first node), a heading, an intro paragraph, and one or more links. The art
 * cell holds an optional poster image and deferred ambient video link.
 */
function afterWindowLoad(callback) {
  const run = () => {
    if ('requestIdleCallback' in window) window.requestIdleCallback(callback, { timeout: 1800 });
    else window.setTimeout(callback, 250);
  };

  if (document.readyState === 'complete') run();
  else window.addEventListener('load', run, { once: true });
}

function videoMimeType(src) {
  try {
    const extension = new URL(src, window.location.href).pathname.split('.').pop().toLowerCase();
    return {
      mp4: 'video/mp4',
      webm: 'video/webm',
      ogg: 'video/ogg',
    }[extension] || '';
  } catch {
    return '';
  }
}

export default function init(block) {
  const cells = [...block.querySelectorAll(':scope > div > div')];
  const [copy, art] = cells;
  if (!copy) return;

  copy.classList.add('hero-copy');

  // Eyebrow: a leading <p> whose only content is <code> or <em>.
  const first = copy.firstElementChild;
  if (first && first.tagName === 'P') {
    const only = first.children.length === 1 ? first.firstElementChild : null;
    if (only && (only.tagName === 'CODE' || only.tagName === 'EM')) {
      first.classList.add('hero-eyebrow');
      first.textContent = only.textContent;
    }
  }

  // Intro: first paragraph after the heading that isn't the eyebrow / actions.
  const heading = copy.querySelector('h1, h2');
  heading?.classList.add('hero-title');

  // Collect links into an actions row; first is primary, rest secondary.
  const links = [...copy.querySelectorAll('a')];
  if (links.length) {
    const actions = document.createElement('div');
    actions.className = 'hero-actions';
    links.forEach((a, i) => {
      a.classList.add('hero-btn', i === 0 ? 'hero-btn-primary' : 'hero-btn-secondary');
      // Unwrap a paragraph that only wraps this link.
      const p = a.closest('p');
      actions.append(a);
      if (p && !p.textContent.trim()) p.remove();
    });
    copy.append(actions);
  }

  // Search is backed by the site's first-party query index.
  createInlineSearch(copy);

  // Art cell.
  if (art) {
    art.classList.add('hero-art');
    const videoLink = [...art.querySelectorAll('a[href]')]
      .find((link) => /\.(mp4|webm|ogg)(\?|#|$)/i.test(link.href));
    const videoSrc = videoLink?.href;
    videoLink?.closest('p')?.remove();

    const poster = art.querySelector('picture, img');
    if (poster) {
      poster.classList.add('hero-art-poster');
      poster.setAttribute('aria-hidden', 'true');
      const image = poster.matches('img') ? poster : poster.querySelector('img');
      if (image) {
        image.alt = '';
        image.loading = 'eager';
        image.setAttribute('fetchpriority', 'high');
      }
    }

    if (videoSrc) {
      const video = document.createElement('video');
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = 'none';
      video.setAttribute('aria-hidden', 'true');
      art.append(video);
      art.classList.add('has-video');

      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        afterWindowLoad(() => {
          const source = document.createElement('source');
          source.src = videoSrc;
          const type = videoMimeType(videoSrc);
          if (type) source.type = type;
          video.append(source);
          video.preload = 'metadata';
          video.addEventListener('playing', () => art.classList.add('is-playing'), { once: true });
          video.load();
          video.play().catch(() => {
            // The poster remains the complete static fallback.
          });
        });
      }
    }

    if (!poster && !videoSrc) art.classList.add('hero-art-placeholder');
  }
}
