/**
 * Link List block — a bordered panel with an optional heading and a multi-column
 * list of links, each followed by a short description.
 *
 * Content model — one item per row (single column):
 *   | Link List |
 *   | --------- |
 *   | :tune: ### Operations & best practices |   (optional heading row)
 *   | [Limits & guidance](/limits) — Bulk operation & data limits |
 *   | [Multi-store](/multi-store) — Store & locale structure |
 */
export default function init(block) {
  const rows = [...block.querySelectorAll(':scope > div')];

  rows.forEach((row) => {
    const cell = row.firstElementChild || row;
    const heading = cell.querySelector('h2, h3, h4, h5, h6');

    if (heading) {
      row.classList.add('link-list-head');
      heading.classList.add('link-list-title');
      return;
    }

    row.classList.add('link-list-item');
    // Style the leading link; the trailing text stays dim via CSS.
    cell.querySelector('a')?.classList.add('link-list-link');
  });
}
