function buildAuthoredTable(el) {
  const authoredRows = [...el.children];
  if (!authoredRows.length) return null;

  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');

  authoredRows.forEach((authoredRow, rowIndex) => {
    const row = document.createElement('tr');
    row.className = rowIndex === 0 ? 'table-heading-row' : 'table-content-row';
    [...authoredRow.children].forEach((authoredCell) => {
      const cell = document.createElement(rowIndex === 0 ? 'th' : 'td');
      if (rowIndex === 0) cell.scope = 'col';
      cell.append(...authoredCell.childNodes);
      row.append(cell);
    });
    (rowIndex === 0 ? thead : tbody).append(row);
  });

  table.append(thead, tbody);
  el.replaceChildren(table);
  return table;
}

export default function init(el) {
  const table = el.querySelector('table') || buildAuthoredTable(el);
  if (!table) return;

  const rows = [...table.querySelectorAll('tr')];
  rows.forEach((row, index) => {
    row.classList.add(index === 0 ? 'table-heading-row' : 'table-content-row');
  });
}
