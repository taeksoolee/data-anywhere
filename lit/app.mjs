import { $, $body } from './assets/common.mjs';
import { createApp, html, classMap } from './assets/lit-helper.mjs';
import { generateGrid } from './assets/grid-helper.mjs';

const getCellId = (rowIdx, colIdx) => `cell_${rowIdx}_${colIdx}`;

function numberToExcelColumn(number) {
  let result = '';
  while (number > 0) {
    const remainder = (number - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    number = Math.floor((number - 1) / 26);
  }
  return result;
}

const ColLine = ($s, colIdx) => {
  return html`
    <div 
      @mousedown="${(e) => e.stopPropagation()}"
      style="${`position: relative; z-index: 1; display: inline-block; width: 1.3px; height: ${$s.heights[colIdx]}px; background-color: gray; cursor: move;`}"
    ></div>
  `;
}

const RowLine = ($s, rowIdx) => {
  return html`
    <div 
      @mousedown="${(e) => e.stopPropagation()}"
      style="${`position: relative; z-index: 1; width: 100%; height: 1.3px; background-color: gray; cursor: move;`}"
    ></div>
  `;
}

const Cell = ($s, rowIdx, colIdx, value) => {
  const setRange = (rowIdx, colIdx) => {
    // selectd address는 포함하지 않음.
    if ($s.selectedAddress === NO_SELECTED_ADDRESS) return;

    const s = [
      Math.min($s.selectedAddress[0], rowIdx),
      Math.min($s.selectedAddress[1], colIdx),
    ];
    const e = [
      Math.max($s.selectedAddress[0], rowIdx),
      Math.max($s.selectedAddress[1], colIdx),
    ];
    const addressRange = [];
    for (let row=s[0]; row<e[0]+1; row++) {
      for (let col=s[1]; col<e[1]+1; col++) {
        addressRange.push([row, col]);
      }
    }
    $s.selectedAddressRange = addressRange;
    $s.cursorAddress = e;
  }

  const select = (rowIdx, colIdx) => {
    $s.cursorAddress = [rowIdx, colIdx];
    $s.selectedAddress = [rowIdx, colIdx];
  }

  const isSelectedAddress = (() => {
    const address = $s.selectedAddress;
    if (rowIdx === address[0] && colIdx === address[1]) return true;
    else return false;
  })();

  const isContainSelectedAddressRange = (() => {
    for (const address of $s.selectedAddressRange) {
      if (rowIdx === address[0] && colIdx === address[1]) return true;
    }

    return false;
  })();

  return html`
    <div 
      role="cell" 
      id="${getCellId(rowIdx, colIdx)}"
      aria-colindex="${colIdx}"
      aria-rowindex="${rowIdx}"
      class="${
        classMap({
          selected: isSelectedAddress,
          range: !isSelectedAddress && isContainSelectedAddressRange,
        })
      }"
      style="${`position: relative; z-index: 2; display: inline-block; width: ${$s.widths[colIdx]}px; height: ${$s.heights[rowIdx]}px; font-size: 12px; overflow: hidden;`}"
      @mousedown="${(e) => {
        e.stopPropagation();
        $s.mode = MODE.SELECT_RANGE;
        $s.selectedAddressRange = [];
        if (e.shiftKey) {
          setRange(rowIdx, colIdx);
        } else {
          if (!(isSelectedAddress)) {
            select(rowIdx, colIdx);
          }
        }
      }}"
      @mousemove="${() => {
        if ($s.mode === MODE.SELECT_RANGE) {
          setRange(rowIdx, colIdx);
        }
      }}"
    >
      <textarea 
        style="width: 100%; height: 100%; border: none; cursor: text;"
        readonly
        @input="${(e) => {
          $s.grid[rowIdx][colIdx] = e.target.value;
        }}"
        @dblclick="${(e) => {
          e.target.readOnly = false;
        }}"
        @blur="${(e) => {
          e.target.readOnly = true;
        }}"
        @keydown="${(e) => {
          if (e.target.readOnly) {
            if (e.code.startsWith('Arrow')) {
              e.preventDefault();
            }

            let val;
            let max;
            let selectedAddress;

            const onKeydownArrowKey = (selectedAddress) => {
              if (e.shiftKey) {
                setRange(...selectedAddress);
                $s.cursorAddress = selectedAddress;
              } else {
                $s.cursorAddress = selectedAddress;
                $s.selectedAddress = selectedAddress;
                $s.selectedAddressRange = [selectedAddress];
              }
            }

            const [rowIdx, colIdx] = e.shiftKey ? $s.cursorAddress : $s.selectedAddress;
            const target = $(`#${getCellId(rowIdx, colIdx)}>textarea`);


            const query = (rowIdx, colIdx) => {
              const cell = $(`#${getCellId(rowIdx, colIdx)}`);
              const ss = $('#spreadsheet');

              return {
                cell, ss,
              }
            }
            
            switch (e.code) {
              case 'ArrowUp': {
                val = rowIdx - 1;
                selectedAddress = [val >= 0 ? val : 0, colIdx];
                onKeydownArrowKey(selectedAddress);
                const {ss, cell} = query(...selectedAddress);
                if (ss && cell) {
                  const {top} = cell.getBoundingClientRect();

                  console.log(top, window.scrollY);
                  if (top <= 20) {
                    if (window.scrollY <= 80 + 20) { // 헤더+(시트헤더) 만큼 남았을때
                      window.scrollTo(0, 0);
                    } else {
                      window.scrollTo(0, window.scrollY + top);
                    }
                  }
                }
                break;
              }
              case 'ArrowLeft': {
                val = colIdx - 1;
                selectedAddress = [rowIdx, val >= 0 ? val : 0];
                onKeydownArrowKey(selectedAddress);
                const {ss, cell} = query(...selectedAddress);
                if (ss && cell) {
                  const {left} = cell.getBoundingClientRect();
                  
                  if (left <= 0) {
                    if (ss.scrollLeft <= 35) { // (시트헤더) 만큼 남았을때
                      ss.scrollTo(0, ss.scrollTop);
                    } else {
                      ss.scrollTo(ss.scrollLeft + left, ss.scrollTop);
                    }
                  }
                }
                break;
              }
              case 'ArrowRight': {
                val = colIdx + 1;
                max = $s.grid[0].length - 1;
                selectedAddress = [rowIdx, val <= max ? val : max];
                onKeydownArrowKey(selectedAddress);
                const {ss, cell} = query(...selectedAddress);
                if (ss && cell) {
                  const {right} = cell.getBoundingClientRect();

                  if (right > window.innerWidth) {
                    ss.scrollTo(ss.scrollLeft + right - window.innerWidth, ss.scrollTop)
                  }
                }
                break;
              }
              case 'ArrowDown': {
                val = rowIdx + 1;
                max = $s.grid.length - 1;
                selectedAddress = [val <= max ? val : max, colIdx];
                onKeydownArrowKey(selectedAddress);
                const {ss, cell} = query(...selectedAddress);
                if (ss && cell) {
                  const {bottom} = cell.getBoundingClientRect();

                  if (bottom > window.innerHeight) {
                    window.scrollTo(0, window.scrollY + bottom - window.innerHeight);
                  }
                }
                break;
              }
              case 'ShiftLeft':
              case 'ShiftRight':
              case 'MetaLeft':
              case 'MetaRight':
              case 'AltLeft':
              case 'AltRight':
              case 'ControlLeft':
              case 'ControlRight':
              case 'Tab':
              case 'CapsLock':
              case 'Enter':
                break;
              case 'Backspace':
                for (const address of $s.selectedAddressRange) {
                  const [rowIdx, colIdx] = address;
                  $(`#${getCellId(rowIdx, colIdx)}>textarea`).value = '';
                  $s.grid[rowIdx][colIdx] = '';
                }
                break;
              default:
                target.readOnly = false;
                target.value = e.target.value;
                target.focus();
                $s.selectedAddressRange = [[rowIdx, colIdx]];
                break;
            }
          }
        }}"
      >${value}</textarea>
    </div>
  `;
}

const Sheet = ($s) => {
  const selectAllRow = (rowIdx) => {
    $s.selectedAddressRange = $s.grid[rowIdx].map((_, colIdx) => ([rowIdx, colIdx]));
  }

  const selectAllCol = (colIdx) => {
    $s.selectedAddressRange = $s.grid.map((_, rowIdx) => ([rowIdx, colIdx]));
  }

  return html`
    <div role="table" style="font-size: 0; width: fit-content;">
      <div style="${`display: flex; position: relative; z-index: 4; top: ${$s.colHeaderFixedTop}px`}">
        ${[0, ...$s.grid[0].map(() => null)].map((_, i) => {
          if (i === 0) return html`<div style="position: fixed; z-index: 4; top: 80px; left: 0px; width: 30px; height: 20px; padding-left: 5px; background-color: gray; color: white;"></div>`;

          return html`
            <div 
              style="width: 100px; height: 20px; background-color: gray; color: white; font-size: 10px; text-align: center;"
              @click="${() => selectAllCol(i-1)}"
            >${numberToExcelColumn(i)}</div>
            ${ColLine($s, i-1)}
          `;
        })}
      </div>
      ${$s.grid.map((row, rowIdx) => html`
        <div role="row" style="display: flex;">
          <div 
            style="${`position: relative; z-index: 3; left: ${$s.rowHeaderFixedLeft}px;width: 30px; padding-left: 5px; font-size: 12px; background-color: gray; color: white;`}" 
            @click="${() => selectAllRow(rowIdx)}"
          >${rowIdx+1}</div>
          ${row.map((value, colIdx) => html`
            ${Cell($s, rowIdx, colIdx, value)}
            ${ColLine($s, colIdx)}
          `)}
        </div>
        ${RowLine($s, rowIdx)}
      `)}
    </div>
  `;
};


const App = ($s) => {
  return html`
    ${Sheet($s)}
  `;
}

const NO_SELECTED_ADDRESS = Object.freeze([-1, -1]);
const MODE = Object.freeze({
  NORMAL: 'normal',
  SELECT_RANGE: 'select-range'
});

const defaultGrid = generateGrid(100, 100);

const {$s} = createApp({
  selector: '#spreadsheet',
  App,
  initialState: {
    cnt: 0,
    grid: defaultGrid,

    selectedAddress: NO_SELECTED_ADDRESS,
    selectedAddressRange: [],
    cursorAddress: NO_SELECTED_ADDRESS,

    mode: MODE.NORMAL,

    heights: defaultGrid.map(() => 20),
    widths: (defaultGrid[0] ?? []).map(() => 100),

    colHeaderFixedTop: 0,
    rowHeaderFixedLeft: 0,
  },
  // handler(target, p, newValue) {
  // }
});


$body.addEventListener('mousedown', () => {
  $s.cursorAddress = NO_SELECTED_ADDRESS;
  $s.selectedAddress = NO_SELECTED_ADDRESS;
  $s.selectedAddressRange = [];
});

$body.addEventListener('mouseup', () => {
  if ($s.mode !== MODE.NORMAL) {
    $s.mode = MODE.NORMAL;
  }
});

$body.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  alert('메뉴 기능 구현 전 입니다.')
})


$('#spreadsheet').addEventListener('paste', (e) => {
  e.preventDefault();
  const clipboardData = e.clipboardData || window.clipboardData;
  const pastedData = clipboardData.getData('text');

  const arr = pastedData.split('\n').map(t => t.split('\t'));

  console.log(pastedData, arr);

  const [rowIdx, colIdx] = $s.selectedAddress;

  const selectedAddressRange = [];

  arr.forEach((row, i) => {
    row.forEach((data, j) => {
      console.log(rowIdx+i, colIdx+j, data);
      $s.grid[rowIdx+i][colIdx+j] = data;
      selectedAddressRange.push([rowIdx+i, colIdx+j]);
    });
  });

  $s.selectedAddressRange = selectedAddressRange;
});

window.addEventListener('scroll', () => {
  $s.colHeaderFixedTop = window.scrollY;
})

$('#spreadsheet').addEventListener('scroll', () => {
  $s.rowHeaderFixedLeft = $('#spreadsheet').scrollLeft;
});