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
  .filter(r => r.length > 0)
  .map(r => r.replace(/&amp;/g, '&').replace(/DO&Atilde;&lsquo;A/g, 'DOÑA'));

// Parse routes from viagraph_experiment.sql
const sqlPath = path.join(__dirname, '..', 'viagraph_experiment.sql');
const sqlContent = fs.readFileSync(sqlPath, 'utf8');

// Find all inserts into routes table
// e.g., INSERT INTO `routes` (`name`, `description`, `color`) VALUES ...
const routesRegex = /INSERT INTO `routes` \(`name`, `description`, `color`[\s\S]+?VALUES\s*\(([\s\S]+?)\);/g;
let mysqlRoutes = [];
let match;
while ((match = routesRegex.exec(sqlContent)) !== null) {
  const valuesBlock = match[1];
  // Parse rows of values
  // e.g. ('ANY JEEP...', 'ANY JEEP...', '#6366f1'), ('BURUUN...', ...)
  const valueRows = valuesBlock.split(/\),\s*\(/);
  valueRows.forEach(row => {
    // Extract first single-quoted string
    const nameMatch = row.match(/'(.*?)'/);
    if (nameMatch) {
      mysqlRoutes.push(nameMatch[1].replace(/\\r\\n/g, ' ').replace(/\\n/g, ' ').trim());
    }
  });
}

// Remove duplicates in mysqlRoutes
mysqlRoutes = [...new Set(mysqlRoutes)];

console.log('MySQL Database Routes parsed:', mysqlRoutes.length);
console.log(mysqlRoutes);

// Compare function
function cleanStr(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace('iliganproper', '')
    .replace('proper', '');
}

const comparison = [];

ltfrbRoutes.forEach(lRoute => {
  const cleanL = cleanStr(lRoute);
  let matchedName = null;
  let score = 0;

  mysqlRoutes.forEach(mRoute => {
    const cleanM = cleanStr(mRoute);
    if (cleanL === cleanM) {
      matchedName = mRoute;
      score = 2;
    } else if (cleanM.includes(cleanL) || cleanL.includes(cleanM)) {
      if (score < 2) {
        matchedName = mRoute;
        score = 1;
      }
    }
  });

  comparison.push({
    ltfrb: lRoute,
    mysql: matchedName || 'MISSING',
    status: score === 2 ? 'Exact' : (score === 1 ? 'Partial' : 'Missing')
  });
});

console.log('\n--- LTFRB vs MySQL Database comparison ---');
comparison.forEach(c => {
  console.log(`LTFRB: "${c.ltfrb}" ➔ MySQL: "${c.mysql}" [${c.status}]`);
});

const missing = comparison.filter(c => c.status === 'Missing');
console.log(`\nTotal Missing: ${missing.length}`);
missing.forEach(m => console.log(`- ${m.ltfrb}`));
