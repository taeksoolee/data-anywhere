const generateRow = (length) => Array.from({length}).map(() => '');

const generateGrid = (rowLength, colLength) => Array.from({length: rowLength}).map(() => generateRow(colLength));

export {
  generateGrid
}