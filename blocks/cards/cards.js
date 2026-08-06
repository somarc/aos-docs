/**
 * Cards block — a responsive grid of cards. Variants drive the layout:
 *   - cards (core):       2-col, icon + title + subtitle + bullet list
 *   - cards (guides):     3-col, icon + title + description + tag chips
 *   - cards (paths):      2-col, icon + title + numbered link list
 *   - cards (resources):  3-col, header + link list
 *
 * Content model — each row is a card. The first cell is an optional icon
 * (`:name:`), the remaining cell is the card body (heading, text, lists).
 */
function decorateTags(body) {
  // Treat a trailing paragraph made only of inline <code> as tag chips.
  const last = body.lastElementChild;
  if (!last || last.tagName !== 'P') return;
  const codes = [...last.childNodes]
    .filter((n) => !(n.nodeType === Node.TEXT_NODE && !n.textContent.trim()));
  if (codes.length && codes.every((n) => n.nodeType === Node.ELEMENT_NODE && n.tagName === 'CODE')) {
    last.classList.add('card-tags');
  }
}

export default function init(block) {
  const cards = [...block.querySelectorAll(':scope > div')];

  cards.forEach((card) => {
    card.classList.add('card');
    const cells = [...card.children];

    // Icon cell: a cell whose meaningful content is a single icon span.
    const iconCell = cells.find((c) => c.querySelector(':scope > .icon') && c.textContent.trim() === '');
    if (iconCell) iconCell.classList.add('card-icon');

    const body = cells[cells.length - 1] === iconCell ? cells[0] : cells[cells.length - 1];
    if (!body || body === iconCell) return;
    body.classList.add('card-body');

    const title = body.querySelector('h2, h3, h4, h5, h6');
    title?.classList.add('card-title');

    decorateTags(body);

    // Whole-card link: when the title is a link, stretch it over the card.
    const titleLink = title?.querySelector('a');
    if (titleLink) {
      card.classList.add('card-linked');
      titleLink.classList.add('card-stretched-link');
    }
  });
}
