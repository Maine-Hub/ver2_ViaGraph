const XLSX = require('xlsx');
const fs = require('fs');

const filePath = 'origin-destination (1).xlsx';
const workbook = XLSX.readFile(filePath);
const sheet = workbook.Sheets['Tambo Terminal'];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

const row9 = data[8]; // Row 9 (1-indexed)
const locationStr = String(row9[0] || '');
const routesJsonStr = String(row9[1] || '');
const jeepneyLine = String(row9[2] || '');
const stopAndTransfer = String(row9[3] || '');

console.log('Location:', locationStr);
console.log('Jeepney:', jeepneyLine);
console.log('Stop:', stopAndTransfer);

let features = [];
try {
  const geojson = JSON.parse(routesJsonStr);
  features = geojson.type === 'FeatureCollection' ? geojson.features : [{ geometry: geojson }];
} catch (e) {
  console.log('JSON Parse Error');
}

console.log('Features length:', features.length);
console.log('Contains TRANSFER:', stopAndTransfer.toUpperCase().includes('TRANSFER'));

if (features.length > 1 && stopAndTransfer.toUpperCase().includes('TRANSFER')) {
  console.log('WOULD SPLIT');
} else {
  console.log('WOULD NOT SPLIT');
}
