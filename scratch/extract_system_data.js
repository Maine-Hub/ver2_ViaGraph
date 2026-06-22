const fs = require('fs');
const path = require('path');

// Paths to files
const dbDumpPath = path.join(__dirname, '..', 'db_dump.json');
const routeBlocksPath = path.join(__dirname, '..', 'excel_geojson_route_blocks_preview.json');
const nodesCachePath = path.join(__dirname, '..', 'nodes_cache.json');
const officialRoutesPath = path.join(__dirname, '..', 'official_routes_preview.json');

// Read files
const dbDump = fs.existsSync(dbDumpPath) ? JSON.parse(fs.readFileSync(dbDumpPath, 'utf8')) : null;
const routeBlocks = fs.existsSync(routeBlocksPath) ? JSON.parse(fs.readFileSync(routeBlocksPath, 'utf8')) : [];
const nodesCache = fs.existsSync(nodesCachePath) ? JSON.parse(fs.readFileSync(nodesCachePath, 'utf8')) : [];
const officialRoutes = fs.existsSync(officialRoutesPath) ? JSON.parse(fs.readFileSync(officialRoutesPath, 'utf8')) : [];

console.log('--- File load stats ---');
console.log(`dbDump has ${dbDump ? dbDump.nodes.length : 0} nodes, ${dbDump ? dbDump.routes.length : 0} routes, and ${dbDump ? dbDump.edges.length : 0} edges.`);
console.log(`routeBlocks has ${routeBlocks.length} items.`);
console.log(`nodesCache has ${nodesCache.length} nodes.`);
console.log(`officialRoutes has ${officialRoutes.length} items.`);

// Let's build a comprehensive report of all Route Data descriptions, Fare information, Stops, and GeoJSON coordinates
let md = `# Comprehensive Transit Data Extraction Report (ViaGraph)

This report extracts and details all routes, stops, fare matrices, and GeoJSON path coordinates stored and used in the ViaGraph (Iligan RouteFinder) system.

---

## 1. Route Data Descriptions
The system defines both official routes (jeepney/minibus lines) and route segments that users can take.

### A. Core Route Definitions
Here are the official transit lines defined in \`db_dump.json\` (total ${dbDump ? dbDump.routes.length : 0} routes):

| Route Line Name | Description | Color Code |
| :--- | :--- | :--- |
${dbDump ? dbDump.routes.map(r => `| **${r.name}** | ${r.description} | \`${r.color}\` |`).join('\n') : '| No routes found in db_dump.json | | |'}

### B. Segment-Level Routes (excel_geojson_route_blocks_preview.json)
These represent specific legs or blocks of travel extracted from standardized spreadsheets:
* **Total unique Excel-defined route blocks**: ${routeBlocks.length}
* **Sample of Route Blocks**:
${routeBlocks.slice(0, 15).map((rb, idx) => `  ${idx + 1}. **${rb.source_name}** to **${rb.target_name}** via *${rb.route_name}* (${rb.vehicle_type}, ${rb.distance} km, Reg Fare: ₱${rb.regular_fare}, Discounted: ₱${rb.discounted_fare})`).join('\n')}

---

## 2. Fare Information
Fare calculation rules are defined in the database (\`fare_matrix\`) and the source code (\`src/lib/fare.ts\`).

### A. Fare Matrix Rules (LTFRB-Derived)
The fare pricing rules for each vehicle type are structured as follows:

| Vehicle Type | Base Fare | Base Distance (km) | succeeding rate (₱/km) | Discount Rate |
| :--- | :--- | :--- | :--- | :--- |
| **jeepney** (Traditional PUJ) | ₱13.00 | 4.0 km | ₱1.80 | 20% |
| **minibus** (Modern PUJ) | ₱15.00 | 4.0 km | ₱2.20 | 20% |
| **bus** | ₱15.00 | 4.0 km | ₱2.20 | 20% |
| **walking** | ₱0.00 | 0.0 km | ₱0.00 | 0% |

*Note: In the code implementation (\`src/lib/fare.ts\`), single-ride segments currently default to the rounded base fare (e.g., ₱13.00 for traditional jeepneys, ₱15.00 for modern jeepneys/minibuses, and ₱0.00 for walking).*

---

## 3. Stops (Nodes)
A list of landmarks, intersections, and terminals serving as transit stops in Iligan City.

### A. All Defined Stops
There are **${nodesCache.length || (dbDump ? dbDump.nodes.length : 0)}** unique stops defined in the nodes registry (\`nodes_cache.json\` / database):

| Stop ID | Official Stop Name | Latitude | Longitude |
| :--- | :--- | :--- | :--- |
${(nodesCache.length ? nodesCache : (dbDump ? dbDump.nodes : [])).map(node => {
  const lat = node.coordinates ? node.coordinates.latitude : node.latitude;
  const lng = node.coordinates ? node.coordinates.longitude : node.longitude;
  return `| \`${node.id}\` | ${node.name} | \`${lat.toFixed(6)}\` | \`${lng.toFixed(6)}\` |`;
}).join('\n')}

---

## 4. GeoJSON Path Coordinates
The system stores spatial paths (sequences of \`[latitude, longitude]\` coordinates) to draw route segments on Leaflet maps.

### A. GeoJSON Coordinate Summary
* **Total blocks with coordinate paths**: ${routeBlocks.filter(rb => rb.path_coordinates).length}
* **Format**: Array of coordinate points: \`[[lat1, lng1], [lat2, lng2], ...]\`.
* **Path Coordinate Details (First 5 blocks)**:

${routeBlocks.slice(0, 5).map(rb => {
  let coords = [];
  try {
    coords = typeof rb.path_coordinates === 'string' ? JSON.parse(rb.path_coordinates) : rb.path_coordinates;
  } catch(e) {}
  return `#### Route: ${rb.route_name} (${rb.source_name} ➔ ${rb.target_name})
- **Vehicle**: ${rb.vehicle_type} | **Distance**: ${rb.distance} km
- **Total Path Points**: ${coords.length}
- **Sample Coordinates**: \`${JSON.stringify(coords.slice(0, 3))}... ${JSON.stringify(coords.slice(-1))}\`
`;
}).join('\n')}

### B. Summary of All Coordinates mapped to segments:
The file \`excel_geojson_route_blocks_preview.json\` contains the full coordinate lists for all ${routeBlocks.length} segments.
`;

const artifactDir = 'C:\\Users\\LENOVO\\.gemini\\antigravity\\brain\\4991eff4-96d9-4120-a685-bcaf6d82f6d3';
const outputPath = path.join(artifactDir, 'extracted_transit_data.md');

fs.mkdirSync(artifactDir, { recursive: true });
fs.writeFileSync(outputPath, md, 'utf8');
console.log(`Artifact successfully written to: ${outputPath}`);
