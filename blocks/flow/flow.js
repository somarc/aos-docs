/**
 * Flow block — a horizontal sequence of nodes connected by chevrons, used for
 * the "how it fits together" architecture diagram.
 *
 * Content model — one node per row, up to 3 cells:
 *   | Flow | | |
 *   | ---- | - | - |
 *   | :storage: | Sources | Catalog & commerce data |
 *   | :hub: | **Product Bus** | Path-based storage |   (bold title = highlight)
 *
 * A bold title marks the highlighted node.
 */
function chevron() {
  const el = document.createElement('span');
  el.className = 'flow-chevron';
  el.setAttribute('aria-hidden', 'true');
  return el;
}

export default function init(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  const track = document.createElement('div');
  track.className = 'flow-track';

  rows.forEach((row, i) => {
    const cells = [...row.children];
    const node = document.createElement('div');
    node.className = 'flow-node';

    const iconCell = cells.find((c) => c.querySelector(':scope > .icon') && c.textContent.trim() === '');
    const textCells = cells.filter((c) => c !== iconCell);
    const [titleCell, subCell] = textCells;

    if (iconCell) {
      iconCell.classList.add('flow-icon');
      node.append(iconCell);
    }
    if (titleCell) {
      titleCell.classList.add('flow-node-title');
      if (titleCell.querySelector('strong')) node.classList.add('flow-node-highlight');
      node.append(titleCell);
    }
    if (subCell) {
      subCell.classList.add('flow-node-sub');
      node.append(subCell);
    }

    track.append(node);
    if (i < rows.length - 1) track.append(chevron());
    row.remove();
  });

  block.append(track);
}
