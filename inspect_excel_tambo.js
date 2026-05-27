const XLSX = require('xlsx');

function inspectExcel() {
  const filePath = 'origin-destination (1).xlsx';
  const workbook = XLSX.readFile(filePath);
  
  const sheetName = 'Tambo Terminal';
  console.log(`--- Inspecting Sheet: ${sheetName} ---`);
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  for (let i = 0; i < 10; i++) {
    console.log(`Row ${i}:`, JSON.stringify(data[i]));
  }
}

inspectExcel();
