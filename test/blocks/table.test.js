import { expect } from '@esm-bundle/chai';
import init from '../../blocks/table/table.js';

describe('DA-authored table block', () => {
  it('converts block rows into a semantic table', () => {
    const block = document.createElement('div');
    block.className = 'table';
    block.innerHTML = `
      <div><div>Surface</div><div>Current</div><div>Direction</div></div>
      <div><div>Product</div><div>DA CLI</div><div>AOS</div></div>`;

    init(block);

    const table = block.querySelector('table');
    expect(table).to.exist;
    expect(table.querySelectorAll('thead th')).to.have.length(3);
    expect(table.querySelector('thead th').scope).to.equal('col');
    expect(table.querySelectorAll('tbody td')).to.have.length(3);
    expect(table.querySelector('tbody tr').classList.contains('table-content-row')).to.equal(true);
  });

  it('decorates an existing semantic table without throwing', () => {
    const block = document.createElement('div');
    block.innerHTML = '<table><tr><td>Heading</td></tr><tr><td>Value</td></tr></table>';

    init(block);

    expect(block.querySelector('tr').classList.contains('table-heading-row')).to.equal(true);
    expect(block.querySelectorAll('.table-content-row')).to.have.length(1);
  });
});
