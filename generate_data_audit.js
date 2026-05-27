const XLSX = require('xlsx');
const fs = require('fs');

// Load nodes for mapping check
const nodesCache = JSON.parse(fs.readFileSync('nodes_cache.json', 'utf8'));
const nameToId = {};
nodesCache.forEach(n => {
  nameToId[n.name.toLowerCase()] = n.id;
  nameToId[n.id.toLowerCase()] = n.id;
});

const aliases = {
  'gaisano': 'gaisano-mall',
  'robinson': 'robinsons-mall',
  'msu-iit': 'msu-iit',
  'iit': 'msu-iit',
  'tambo terminal': 'tambo-terminal',
  'tambo market': 'tambo-market',
  'paseo': 'paseo-santaigo',
  'plaza': 'public-plaza',
  'city hall': 'iligan-cityhall',
  'wet market': 'wet-market',
  'gaisano mall': 'gaisano-mall',
  'robinsons': 'robinsons-mall',
  'cathedral': 'st.michael-cathedral',
  'st. michael college': 'st.michael\'s-college',
  'psa': 'psa-office',
  'philhealth': 'philhealth-office',
  'red cross': 'red-cross',
  'port of iligan': 'iligan-port',
  'children\'s park': 'childrens-park',
  'centennial park': 'centennial-park',
  'night market': 'night-market',
  'zoey': "zoey's-cafe",
  'suki club': 'gaisano-sukiclub',
  'regs / soda beach': 'soda-beach',
  'soda': 'soda-beach',
  'crown paper': 'v-crown-paper',
  'robinsons mall': 'robinsons-mall',
  'st michael cathedral': 'st.michael-cathedral',
  'st michael college': 'st.michael\'s-college',
  'jollibee aguinaldo': 'v-jollibee-aguinaldo',
  'desmark': 'v-desmark'
};

function normalizeName(name) {
  if (!name) return '';
  let n = name.toLowerCase().trim();
  if (aliases[n]) return aliases[n];
  n = n.replace(/iligan\s+/g, '').replace(/\s+proper/g, '').replace(/^from\s+/i, '').replace(/\s+to\s+.*$/i, '').replace(/’/g, "'");
  if (aliases[n]) return aliases[n];
  return n;
}

function checkMapping(name) {
  const norm = normalizeName(name);
  if (nameToId[norm]) return { id: nameToId[norm], status: 'EXACT' };
  
  for (const key in nameToId) {
    if (key.includes(norm) || norm.includes(key)) return { id: nameToId[key], status: 'PARTIAL' };
  }
  
  return { id: norm.replace(/\s+/g, '-'), status: 'GUESSED' };
}

function generateAudit() {
  const filePath = 'origin-destination (1).xlsx';
  const workbook = XLSX.readFile(filePath);
  let auditMarkdown = '# Iligan Route Data Audit Report\n\n';
  auditMarkdown += `Generated on: ${new Date().toLocaleString()}\n\n`;
  auditMarkdown += '## Summary of Findings\n\n';
  
  let totalRows = 0;
  let exactMappings = 0;
  let guessedMappings = 0;
  let missingGeometry = 0;
  let multiLegRoutes = 0;

  const details = [];

  workbook.SheetNames.forEach(sheetName => {
    if (sheetName === 'r') return;
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    const rows = data.slice(1);

    rows.forEach((row, rowIndex) => {
      if (row.length === 0) return;
      totalRows++;

      const locationStr = String(row[0] || '');
      const geoJsonStr = String(row[1] || '');
      const stopTransfer = String(row[3] || '');
      const distStr = String(row[4] || '');
      const fareStr = String(row[5] || '');

      let mainSource = '';
      let mainTarget = '';
      if (locationStr.toLowerCase().includes(' to ')) {
        const parts = locationStr.split(/\s+to\s+/i);
        mainTarget = parts[parts.length - 1].trim();
        mainSource = parts.slice(0, parts.length - 1).join(' to ').replace(/^from\s+/i, '').trim();
      }

      const sourceMap = checkMapping(mainSource);
      const targetMap = checkMapping(mainTarget);

      if (sourceMap.status === 'EXACT') exactMappings++;
      if (targetMap.status === 'EXACT') exactMappings++;
      if (sourceMap.status === 'GUESSED' || targetMap.status === 'GUESSED') guessedMappings++;
      
      const isMulti = geoJsonStr.includes('LineString') && geoJsonStr.match(/LineString/g).length > 1;
      if (isMulti) multiLegRoutes++;

      const issues = [];
      if (!geoJsonStr.includes('LineString')) issues.push('Missing/Invalid GeoJSON');
      if (sourceMap.status === 'GUESSED') issues.push(`Unknown Source: "${mainSource}"`);
      if (targetMap.status === 'GUESSED') issues.push(`Unknown Target: "${mainTarget}"`);
      if (!distStr || distStr.trim() === '0') issues.push('Distance Missing (Auto-calculated)');
      if (!fareStr || fareStr.trim() === '0') issues.push('Fare Missing (Auto-calculated)');

      details.push({
        sheet: sheetName,
        row: rowIndex + 2,
        route: locationStr,
        type: isMulti ? 'Multi-Leg' : 'Single',
        status: issues.length > 0 ? '⚠️ Issues' : '✅ OK',
        issueList: issues
      });
    });
  });

  auditMarkdown += `* **Total Rows Processed**: ${totalRows}\n`;
  auditMarkdown += `* **Multi-Leg Routes Detected**: ${multiLegRoutes}\n`;
  auditMarkdown += `* **Exact Node Mappings**: ${exactMappings} / ${totalRows * 2}\n`;
  auditMarkdown += `* **Guessed/Fallback Mappings**: ${guessedMappings}\n\n`;

  auditMarkdown += '## Detailed Audit\n\n';
  auditMarkdown += '| Sheet | Row | Route | Type | Status | Issues Found |\n';
  auditMarkdown += '| :--- | :--- | :--- | :--- | :--- | :--- |\n';

  details.forEach(d => {
    auditMarkdown += `| ${d.sheet} | ${d.row} | ${d.route} | ${d.type} | ${d.status} | ${d.issueList.join(', ') || 'None'} |\n`;
  });

  fs.writeFileSync('route_data_audit.md', auditMarkdown);
  console.log('Audit report generated: route_data_audit.md');
}

generateAudit();
