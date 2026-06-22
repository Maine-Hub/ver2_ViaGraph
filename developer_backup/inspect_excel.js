const XLSX = require('xlsx');

function inspectExcel() {
  const filePath = 'origin-destination (1).xlsx';
  const workbook = XLSX.readFile(filePath);
  
  console.log('Sheet Names:', workbook.SheetNames);
  
  workbook.SheetNames.forEach(sheetName => {
    console.log(`\n--- Inspecting Sheet: ${sheetName} ---`);
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (data.length > 0) {
      const columns = data[0];
      console.log('Columns:', JSON.stringify(columns, null, 2));
      
      const sampleRow = data.find(row => row.some(val => String(val).includes('LineString')));
      if (sampleRow) {
        console.log('Sample Row with GeoJSON:');
        sampleRow.forEach((val, i) => {
          if (String(val).includes('LineString')) {
             console.log(`[${i}] ${columns[i] || 'Unnamed'}: [GEOJSON STRING]`);
          } else {
             console.log(`[${i}] ${columns[i] || 'Unnamed'}: ${String(val).substring(0, 50)}`);
          }
        });
      }
      console.log('Total Rows:', data.length - 1);
    } else {
      console.log('The sheet is empty.');
    }
  });
}

inspectExcel();
