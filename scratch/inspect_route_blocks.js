const XLSX = require('xlsx');

function inspectTargetExcel() {
  const filePath = 'ViaGraph_Standardized_Dataset_Draft.xlsx';
  const workbook = XLSX.readFile(filePath);
  
  const sheetName = 'RouteBlocks';
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    console.error(`Sheet "${sheetName}" not found!`);
    return;
  }

  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  if (data.length === 0) {
    console.error('Sheet is empty');
    return;
  }

  const headers = data[0];
  const colIndex = headers.indexOf('path_geojson');
  if (colIndex === -1) {
    console.error('Column "path_geojson" not found!');
    console.log('Headers found:', headers);
    return;
  }

  console.log(`Inspecting column "path_geojson" (Index ${colIndex})`);
  
  // Show first 15 rows to see both the "uniformed" and "non-uniformed" data
  for (let i = 1; i < Math.min(data.length, 16); i++) {
    const row = data[i];
    const val = row[colIndex];
    console.log(`Row ${i}: ${String(val).substring(0, 100)}${String(val).length > 100 ? '...' : ''}`);
  }
}

inspectTargetExcel();
