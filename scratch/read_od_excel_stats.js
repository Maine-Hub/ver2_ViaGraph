const XLSX = require('xlsx');

function main() {
  const filePath = 'origin-destination (1).xlsx';
  console.log('Inspecting:', filePath);
  const workbook = XLSX.readFile(filePath);
  
  console.log('Sheets:', workbook.SheetNames);
  
  // Let's loop through sheet names and print count of rows
  workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);
    console.log(`Sheet "${sheetName}": ${data.length} rows`);
  });
}

main();
