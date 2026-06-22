const fs = require('fs');
const path = require('path');

const ltfrbText = `
ILIGAN PROPER- 542 PALAO RIVERSIDE-MEDIC
ILIGAN PROPER-ABEGAIL SUBD-COUNTRY HILLS
ILIGAN PROPER-BACAYO-MERCY-SOUTHBOUND
ILIGAN PROPER-BARAAS NFA V. LAVILLE
ILIGAN PROPER-BARINAUT
ILIGAN PROPER-BAYANIHAN VILL(STA ELENA)
ILIGAN PROPER-BLISS-MAZE PARK-TONGGO
ILIGAN PROPER-BRGY. BAGONG SILANG
ILIGAN PROPER-BRGY. SAN MIGUEL-ST MARY
ILIGAN PROPER-BRGY. SANTIAGO
ILIGAN PROPER-BURUUN
ILIGAN PROPER-CARBIDE
ILIGAN PROPER-CEANURI-TOMAS CABILI
ILIGAN PROPER-CITY HALL-MEDICAL
ILIGAN PROPER-COUNTRYHILLS SUBD-TIBANGA
ILIGAN PROPER-DALIPUGA
ILIGAN PROPER-DEL CARMEN-ERLINDAVILLE
ILIGAN PROPER-DEL CARMEN-IBJT
ILIGAN PROPER-DO&Atilde;&lsquo;A MARIA SUBD.
ILIGAN PROPER-DO&Atilde;&lsquo;A MARIA SUBD.
ILIGAN PROPER-GREEN HEIGHTS VIA ANDRADA
ILIGAN PROPER-GREENFIELDS-UBALDO LAYA
ILIGAN PROPER-HINAPLANON-CROSSING
ILIGAN PROPER-ISABEL V. CITY HOSP./NORIA
ILIGAN PROPER-ISABEL VILL.-BRGY UBALDO
ILIGAN PROPER-JEFFREY RD-ERLINDA VILLE
ILIGAN PROPER-KALUBIHON-LACOB
ILIGAN PROPER-LA SALLE-VILLAVERDE
ILIGAN PROPER-LUINAB-BAHAYAN
ILIGAN PROPER-MERILA
ILIGAN PROPER-MIMBALUT-TAYTAY
ILIGAN PROPER-NOVILLE-ORELLANA
ILIGAN PROPER-NSC HIGHWAY-TOMAS CABILI
ILIGAN PROPER-SAN ROQUE
ILIGAN PROPER-SAWALI-FUENTES
ILIGAN PROPER-SCIONS
ILIGAN PROPER-STA. ELENA-STEELTOWN
ILIGAN PROPER-STA. FELOMINA-ACMAC
ILIGAN PROPER-STEELTOWN
ILIGAN PROPER-STO. ROSARIO-BARTOLOME-ORC
ILIGAN PROPER-SUAREZ
ILIGAN PROPER-SUAREZ-IISHI
ILIGAN PROPER-TAMBACAN
ILIGAN PROPER-TAMBO GERONA
ILIGAN PROPER-TAMBO-BAYUG
ILIGAN PROPER-TAYTAY-MIMBALOT
ILIGAN PROPER-TINAGO V. MIMBALOT
ILIGAN PROPER-TIPANOY-PINDUNGANAN
ILIGAN PROPER-TOMINOBO-BUSAY V. SCIONS
ILIGAN PROPER-TOPANOY
ILIGAN PROPER-TUBOD-ROSARIO HEIGHTS
ILIGAN PROPER-UBALDO LAYA-GREEN FIELDS
ILIGAN PROPER-UPPER HINAPLANON-CABARO
ILIGAN PROPER-UPPER HINAPLANON-WAGO
ILIGAN PROPER-UPPER LUINAB V. MANRIQUE
ILIGAN PROPER-UPPER PAITAN-DALIPUGA
ILIGAN PROPER-UPPER TOMINOBO
ILIGAN PROPER-VILLA CELESTE
ILIGAN PROPER-VILLAVERDE
MA. CRISTINA - ILIGAN PROPER & V.V
`;

const ltfrbRoutes = ltfrbText
  .split('\n')
  .map(r => r.trim())
  .filter(r => r.length > 0);

const dbDumpPath = path.join(__dirname, '..', 'db_dump.json');
const dbDump = JSON.parse(fs.readFileSync(dbDumpPath, 'utf8'));

const dbRoutes = dbDump.routes || [];

// Function to normalize strings for comparison
function cleanStr(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace('iliganproper', '')
    .replace('proper', '');
}

const analysis = [];

ltfrbRoutes.forEach(lRoute => {
  // Let's decode the corrupted entities in LTFRB names
  let decodedRoute = lRoute
    .replace(/&amp;/g, '&')
    .replace(/DO&Atilde;&lsquo;A/g, 'DOÑA');

  const cleanL = cleanStr(decodedRoute);

  // Search in dbRoutes
  let matchedRoute = null;
  let score = 0; // 0: no match, 1: fuzzy match, 2: strong/exact match

  // Try to find exact/strong match
  dbRoutes.forEach(dRoute => {
    const cleanD = cleanStr(dRoute.name) || cleanStr(dRoute.description || '');
    
    // Check if names match exactly when stripped of prefix
    if (cleanL === cleanD) {
      matchedRoute = dRoute;
      score = 2;
    } else if (cleanD.includes(cleanL) || cleanL.includes(cleanD)) {
      if (score < 2) {
        matchedRoute = dRoute;
        score = 1;
      }
    }
  });

  analysis.push({
    ltfrbName: decodedRoute,
    matchedSystemName: matchedRoute ? matchedRoute.name : 'MISSING',
    matchType: score === 2 ? 'Exact/Strong' : (score === 1 ? 'Fuzzy/Partial' : 'Missing'),
    description: matchedRoute ? matchedRoute.description : ''
  });
});

console.log('--- Comparison Results ---');
console.log(`Total LTFRB Routes: ${ltfrbRoutes.length}`);
const matchedCount = analysis.filter(a => a.matchType !== 'Missing').length;
console.log(`Matched: ${matchedCount}`);
console.log(`Missing from system: ${ltfrbRoutes.length - matchedCount}`);

console.log('\n--- Matched Routes ---');
analysis.filter(a => a.matchType !== 'Missing').forEach(a => {
  console.log(`LTFRB: "${a.ltfrbName}" ➔ System: "${a.matchedSystemName}" (${a.matchType})`);
});

console.log('\n--- Missing Routes ---');
analysis.filter(a => a.matchType === 'Missing').forEach(a => {
  console.log(`- ${a.ltfrbName}`);
});

// Let's write the analysis report to the artifact directory
let md = `# LTFRB Route List Integration Analysis

This report compares the official route list provided by the LTFRB with the current route database in ViaGraph, identifying matching names, potential naming conventions, and missing routes.

---

## 1. Summary of Comparison
* **Total Routes in LTFRB List**: ${ltfrbRoutes.length}
* **Matched/Fuzzy Matched in System**: ${matchedCount} routes
* **Missing from current system**: ${ltfrbRoutes.length - matchedCount} routes
* **Denomination Code**: All routes are classified as **PUJ** (Public Utility Jeepney), which represents traditional jeepneys in Iligan City.

---

## 2. Detailed Mapping Table

| Official LTFRB Route Name | Matched System Route | Match Status | Description / Notes |
| :--- | :--- | :--- | :--- |
${analysis.map(a => {
  let statusEmoji = a.matchType === 'Exact/Strong' ? '✅ Exact' : (a.matchType === 'Fuzzy/Partial' ? '⚠️ Fuzzy' : '❌ Missing');
  return `| **${a.ltfrbName}** | \`${a.matchedSystemName}\` | ${statusEmoji} | ${a.description || '*No description (Missing route)*'} |`;
}).join('\n')}

---

## 3. Key Observations & Recommendations

### A. Naming Convention Differences
1. **Prefixing**: The LTFRB list prefixes all route names with \`ILIGAN PROPER-\` (e.g., \`ILIGAN PROPER-DALIPUGA\`). The system database stores them either without the prefix or suffixes them with \`-ILIGAN PROPER\` (e.g., \`DALIPUGA-ILIGAN PROPER\`).
2. **Corrupted Encoding**: The LTFRB list contains HTML entity encoding issues like \`DO&Atilde;&lsquo;A MARIA SUBD.\` which corresponds to **DOÑA MARIA SUBD.** and \`MA. CRISTINA - ILIGAN PROPER &amp; V.V\` which corresponds to **MA. CRISTINA - ILIGAN PROPER & V.V**. These must be normalized when ingested.
3. **Double Entry**: \`ILIGAN PROPER-DO&Atilde;&lsquo;A MARIA SUBD.\` appears twice consecutively in the LTFRB file. This duplicate entry should be de-duplicated.

### B. Action Plan for Ingestion
To use this official LTFRB route list in our system, we should:
1. **Clean and Decode**: Run a cleanup script to decode entities (e.g., convert \`&amp;\` to \`&\`, \`DO&Atilde;&lsquo;A\` to \`DOÑA\`).
2. **Standardize Name Formats**: Convert them to match the system's naming standard (e.g., remove the \`ILIGAN PROPER-\` prefix and suffix it as \`NAME-ILIGAN PROPER\`).
3. **Database Import**: Insert the missing routes into the \`routes\` table.
4. **Digitization & Coordinates**: Since these missing routes do not currently have corresponding route blocks (edges) or GeoJSON coordinates in the system, we will need to obtain the coordinate paths (digitize them) before they can be utilized by the shortest-path routing algorithm.
`;

const artifactDir = 'C:\\Users\\LENOVO\\.gemini\\antigravity\\brain\\4991eff4-96d9-4120-a685-bcaf6d82f6d3';
const outputPath = path.join(artifactDir, 'ltfrb_route_analysis.md');

fs.mkdirSync(artifactDir, { recursive: true });
fs.writeFileSync(outputPath, md, 'utf8');
console.log(`\nWritten analysis report to: ${outputPath}`);
