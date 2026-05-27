const mysql = require('mysql2/promise');
const XLSX = require('xlsx');
const fs = require('fs');

async function exportToStandardExcel() {
  let db;
  try {
    db = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'viagraph_experiment'
    });
    console.log('Connected to viagraph_experiment database.');

    // 1. Fetch Nodes
    console.log('Fetching nodes...');
    const [nodes] = await db.execute('SELECT id, name, latitude, longitude FROM nodes');
    const nodesData = nodes.map(n => ({
      id: n.id,
      name: n.name,
      latitude: n.latitude,
      longitude: n.longitude,
      aliases: '' // To be filled manually if needed
    }));

    // 2. Fetch Route Blocks
    console.log('Fetching route blocks...');
    const [blocks] = await db.execute('SELECT source_id, target_id, route_name, vehicle_type, distance, path_coordinates FROM route_blocks');
    const blocksData = blocks.map(b => ({
      source_node_id: b.source_id,
      target_node_id: b.target_id,
      route_name: b.route_name,
      vehicle_type: b.vehicle_type,
      distance_km: b.distance,
      path_geojson: b.path_coordinates // This is already a JSON string of coords
    }));

    // 3. Create Fare Matrix (Authoritative Rules)
    const fareMatrixData = [
      {
        vehicle_type: 'jeepney',
        base_fare: 13.0,
        base_km: 4.0,
        succeeding_km_rate: 1.8,
        discount_rate: 0.20,
        notes: 'Traditional PUJ LTFRB Matrix'
      },
      {
        vehicle_type: 'minibus',
        base_fare: 15.0,
        base_km: 4.0,
        succeeding_km_rate: 2.2,
        discount_rate: 0.20,
        notes: 'Modern PUJ / Cooperative Minibus Matrix'
      },
      {
        vehicle_type: 'walking',
        base_fare: 0,
        base_km: 0,
        succeeding_km_rate: 0,
        discount_rate: 0,
        notes: 'Walking segments'
      }
    ];

    // 4. Generate Workbook
    console.log('Generating Excel workbook...');
    const wb = XLSX.utils.book_new();

    const nodesSheet = XLSX.utils.json_to_sheet(nodesData);
    XLSX.utils.book_append_sheet(wb, nodesSheet, 'Nodes');

    const blocksSheet = XLSX.utils.json_to_sheet(blocksData);
    XLSX.utils.book_append_sheet(wb, blocksSheet, 'RouteBlocks');

    const fareSheet = XLSX.utils.json_to_sheet(fareMatrixData);
    XLSX.utils.book_append_sheet(wb, fareSheet, 'FareMatrix');

    // 5. Write File
    const outputFilename = 'ViaGraph_Standardized_Dataset_Draft.xlsx';
    XLSX.writeFile(wb, outputFilename);
    
    console.log(`\nSUCCESS: Standardized dataset exported to "${outputFilename}"`);
    console.log('---------------------------------------------------------');
    console.log(`Total Nodes: ${nodesData.length}`);
    console.log(`Total Route Blocks: ${blocksData.length}`);
    console.log('---------------------------------------------------------');
    console.log('Next Steps:');
    console.log('1. Open the Excel and review the "RouteBlocks" sheet.');
    console.log('2. Ensure "source_node_id" and "target_node_id" are consistent.');
    console.log('3. Once validated, we will use this file for Phase 2 (Bootstrap).');

  } catch (error) {
    console.error('Export failed:', error);
  } finally {
    if (db) await db.end();
  }
}

exportToStandardExcel();
