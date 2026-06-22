import fs from 'fs';

function main() {
  const sqlContent = fs.readFileSync('viagraph_experiment.sql', 'utf8');
  
  // Find all inserts for nodes
  const nodesMatch = sqlContent.match(/INSERT INTO `nodes`[^(]*\(([^;]*)\);/);
  if (nodesMatch) {
    const rows = nodesMatch[1].split(/\),\s*\(/);
    console.log('SQL dump nodes insert count:', rows.length);
  } else {
    console.log('No INSERT for nodes found.');
  }

  // Find all inserts for routes
  const routesMatch = sqlContent.match(/INSERT INTO `routes`[^(]*\(([^;]*)\);/);
  if (routesMatch) {
    const rows = routesMatch[1].split(/\),\s*\(/);
    console.log('SQL dump routes insert count:', rows.length);
  } else {
    console.log('No INSERT for routes found.');
  }

  // Find all inserts for route_blocks
  const blocksMatch = sqlContent.match(/INSERT INTO `route_blocks`[^(]*\(([^;]*)\);/);
  if (blocksMatch) {
    const rows = blocksMatch[1].split(/\),\s*\(/);
    console.log('SQL dump route_blocks insert count:', rows.length);
    
    // Analyze vehicle types
    let jeepneyCount = 0;
    let minibusCount = 0;
    let busCount = 0;
    let walkingCount = 0;
    
    rows.forEach(r => {
      if (r.includes("'jeepney'")) jeepneyCount++;
      else if (r.includes("'minibus'")) minibusCount++;
      else if (r.includes("'bus'")) busCount++;
      else if (r.includes("'walking'")) walkingCount++;
    });
    
    console.log('SQL dump vehicle breakdown:');
    console.log(`- Jeepney: ${jeepneyCount}`);
    console.log(`- Minibus: ${minibusCount}`);
    console.log(`- Bus: ${busCount}`);
    console.log(`- Walking: ${walkingCount}`);
  } else {
    console.log('No INSERT for route_blocks found.');
  }
}

main();
