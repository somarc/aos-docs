import { getMetadata } from '../nx.js';

const STATUS_LABELS = {
  current: 'Current',
  direction: 'Product direction',
  advanced: 'Advanced',
  integration: 'Integration',
};

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  return !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function issueUrl(pathname) {
  const params = new URLSearchParams({
    title: `Docs feedback: ${pathname}`,
    body: `Page: ${window.location.origin}${pathname}\n\nWhat should be clarified or corrected?\n`,
  });
  return `https://github.com/somarc/aos-docs/issues/new?${params}`;
}

export default function decoratePageDetails(main = document.querySelector('main')) {
  if (!main || !document.body.classList.contains('docs-template')) return null;

  const appliesTo = getMetadata('applies-to');
  const statusKey = (getMetadata('page-status') || '').trim().toLowerCase();
  const status = STATUS_LABELS[statusKey];
  const lastReviewed = getMetadata('last-reviewed');

  const footer = document.createElement('footer');
  footer.className = 'doc-pagefooter';
  footer.setAttribute('aria-label', 'Page details');

  const facts = document.createElement('div');
  facts.className = 'doc-pagefacts';

  if (status) {
    const badge = document.createElement('span');
    badge.className = `doc-page-status doc-page-status-${statusKey}`;
    badge.textContent = status;
    facts.append(badge);
  }

  if (appliesTo) {
    const applies = document.createElement('span');
    applies.className = 'doc-applies-to';
    applies.textContent = `Applies to ${appliesTo}`;
    facts.append(applies);
  }

  if (validDate(lastReviewed)) {
    const reviewed = document.createElement('span');
    reviewed.className = 'doc-last-reviewed';
    reviewed.append('Reviewed ');
    const time = document.createElement('time');
    time.dateTime = lastReviewed;
    time.textContent = new Intl.DateTimeFormat(document.documentElement.lang || 'en', {
      dateStyle: 'medium',
      timeZone: 'UTC',
    }).format(new Date(`${lastReviewed}T00:00:00Z`));
    reviewed.append(time);
    facts.append(reviewed);
  }

  const feedback = document.createElement('a');
  feedback.className = 'doc-feedback-link';
  feedback.href = issueUrl(window.location.pathname);
  feedback.textContent = 'Report a documentation issue';

  if (facts.children.length) footer.append(facts);
  footer.append(feedback);
  main.append(footer);
  return footer;
}
