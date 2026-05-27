const mysql = require('mysql2/promise');
const XLSX = require('xlsx');

async function bootstrapSystem() {
  let db;
  try {
    db = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'viagraph_experiment'
    });
    console.log('Connected to viagraph_experiment database.');

    // 1. Wipe and Recreate Tables
    console.log('Resetting database schema...');
    await db.execute('SET FOREIGN_KEY_CHECKS = 0;');
    
    // Drop old deprecated tables if they exist to clean up the DB
    await db.execute('DROP TABLE IF EXISTS transfer_legs');
    await db.execute('DROP TABLE IF EXISTS transfers');
    await db.execute('DROP TABLE IF EXISTS routes');
    await db.execute('DROP TABLE IF EXISTS edges');
    await db.execute('DROP TABLE IF EXISTS fare_rules');
    
    // Drop current tables
    await db.execute('DROP TABLE IF EXISTS route_blocks');
    await db.execute('DROP TABLE IF EXISTS fare_matrix');
    await db.execute('DROP TABLE IF EXISTS nodes');
    
    await db.execute('SET FOREIGN_KEY_CHECKS = 1;');

    await db.execute(`
      CREATE TABLE nodes (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        aliases TEXT
      )
    `);

    await db.execute(`
      CREATE TABLE routes (
        name VARCHAR(100) PRIMARY KEY,
        description TEXT,
        color VARCHAR(20) DEFAULT '#6366f1'
      )
    `);

    await db.execute(`
      CREATE TABLE fare_matrix (
        id INT AUTO_INCREMENT PRIMARY KEY,
        vehicle_type VARCHAR(50) NOT NULL,
        base_fare DECIMAL(10, 2) NOT NULL,
        base_km DECIMAL(10, 2) NOT NULL,
        succeeding_km_rate DECIMAL(10, 2) NOT NULL,
        discount_rate DECIMAL(5, 2) NOT NULL
      )
    `);

    await db.execute(`
      CREATE TABLE route_blocks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        source_id VARCHAR(100) NOT NULL,
        target_id VARCHAR(100) NOT NULL,
        route_name VARCHAR(100) NOT NULL,
        vehicle_type VARCHAR(50) NOT NULL,
        distance DECIMAL(10, 3) NOT NULL,
        regular_fare DECIMAL(10, 2) NOT NULL,
        discounted_fare DECIMAL(10, 2) NOT NULL,
        path_coordinates LONGTEXT,
        original_excel_ref TEXT,
        block_order INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (source_id) REFERENCES nodes(id),
        FOREIGN KEY (target_id) REFERENCES nodes(id)
      )
    `);

    // 2. Read Excel File
    const filePath = 'ViaGraph_Final_Standardized_Source.xlsx';
    console.log(`Reading standardized dataset from ${filePath}...`);
    const workbook = XLSX.readFile(filePath);

    // 3. Populate Fare Matrix
    console.log('Populating fare_matrix...');
    const fareSheet = workbook.Sheets['FareMatrix'];
    const fareData = XLSX.utils.sheet_to_json(fareSheet);
    
    // Create a map in memory to use for route_blocks calculation
    const fareRules = {};
    for (const row of fareData) {
      fareRules[row.vehicle_type] = {
        base_fare: Number(row.base_fare),
        base_km: Number(row.base_km),
        succeeding_km_rate: Number(row.succeeding_km_rate),
        discount_rate: Number(row.discount_rate)
      };
      
      await db.execute(
        'INSERT INTO fare_matrix (vehicle_type, base_fare, base_km, succeeding_km_rate, discount_rate) VALUES (?, ?, ?, ?, ?)',
        [row.vehicle_type, row.base_fare, row.base_km, row.succeeding_km_rate, row.discount_rate]
      );
    }

    // 4. Populate Nodes
    console.log('Populating nodes...');
    const nodesSheet = workbook.Sheets['Nodes'];
    const nodesData = XLSX.utils.sheet_to_json(nodesSheet);
    for (const row of nodesData) {
      await db.execute(
        'INSERT INTO nodes (id, name, latitude, longitude, aliases) VALUES (?, ?, ?, ?, ?)',
        [row.id, row.name, row.latitude, row.longitude, row.aliases || '']
      );
    }

    // 5. Populate Route Blocks (with calculated cached fares)
    console.log('Populating route_blocks and calculating cached fares...');
    const blocksSheet = workbook.Sheets['RouteBlocks'];
    const blocksData = XLSX.utils.sheet_to_json(blocksSheet);
    
    function calculateFare(distance, type) {
      if (type === 'walking' || distance <= 0) return 0;
      const rule = fareRules[type] || fareRules['jeepney'];
      if (!rule) return 0;
      let raw = rule.base_fare;
      if (distance > rule.base_km) {
        raw += (distance - rule.base_km) * rule.succeeding_km_rate;
      }
      return Math.round(raw / 0.25) * 0.25;
    }

    function calculateDiscountedFare(distance, type) {
      if (type === 'walking' || distance <= 0) return 0;
      const rule = fareRules[type] || fareRules['jeepney'];
      if (!rule) return 0;
      let rawRegular = rule.base_fare;
      if (distance > rule.base_km) {
        rawRegular += (distance - rule.base_km) * rule.succeeding_km_rate;
      }
      const rawDiscounted = rawRegular * (1 - rule.discount_rate);
      return Math.round(rawDiscounted / 0.25) * 0.25;
    }

    const insertedNodeIds = new Set(nodesData.map(n => n.id));

    // Aliases to fix minor typos in the generated excel
    const aliasesFix = {
      'city-public-plaza': 'public-plaza',
      'medical-center-hospital': 'iligan-medical-center-hospital',
      'medical-center-college': 'iligan-medical-center-college',
      'robinson-mall': 'robinsons-mall',
      'southbound-terminal': 'south-bound-terminal'
    };

    const insertedRoutes = new Set();

    for (const row of blocksData) {
      const regularFare = calculateFare(row.distance_km, row.vehicle_type);
      const discountedFare = calculateDiscountedFare(row.distance_km, row.vehicle_type);

      let sId = aliasesFix[row.source_node_id] || row.source_node_id;
      let tId = aliasesFix[row.target_node_id] || row.target_node_id;

      // Extract coords to create phantom nodes if needed
      let coords = [];
      try {
        coords = JSON.parse(row.path_geojson);
      } catch (e) {}

      // Auto-create missing source node
      if (!insertedNodeIds.has(sId)) {
        const lat = coords.length > 0 ? coords[0][0] : 8.2280;
        const lng = coords.length > 0 ? coords[0][1] : 124.2452;
        await db.execute(
          'INSERT INTO nodes (id, name, latitude, longitude, aliases) VALUES (?, ?, ?, ?, ?)',
          [sId, sId.replace(/-/g, ' ').toUpperCase() + ' (Auto-Generated)', lat, lng, '']
        );
        insertedNodeIds.add(sId);
        console.log(`[WARNING] Auto-created missing node: ${sId}`);
      }

      // Auto-create missing target node
      if (!insertedNodeIds.has(tId)) {
        const lat = coords.length > 0 ? coords[coords.length - 1][0] : 8.2280;
        const lng = coords.length > 0 ? coords[coords.length - 1][1] : 124.2452;
        await db.execute(
          'INSERT INTO nodes (id, name, latitude, longitude, aliases) VALUES (?, ?, ?, ?, ?)',
          [tId, tId.replace(/-/g, ' ').toUpperCase() + ' (Auto-Generated)', lat, lng, '']
        );
        insertedNodeIds.add(tId);
        console.log(`[WARNING] Auto-created missing node: ${tId}`);
      }
      
      // Auto-create route in 'routes' table for color management
      if (!insertedRoutes.has(row.route_name)) {
          await db.execute(
              'INSERT INTO routes (name, description, color) VALUES (?, ?, ?)',
              [row.route_name, row.route_name, '#6366f1']
          );
          insertedRoutes.add(row.route_name);
      }

      await db.execute(
        `INSERT INTO route_blocks 
        (source_id, target_id, route_name, vehicle_type, distance, regular_fare, discounted_fare, path_coordinates, original_excel_ref) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          sId, 
          tId, 
          row.route_name, 
          row.vehicle_type, 
          row.distance_km, 
          regularFare, 
          discountedFare, 
          row.path_geojson,
          row.original_excel_ref || ''
        ]
      );
    }

    console.log('\nSUCCESS: System Bootstrapped.');
    console.log('---------------------------------------------------------');
    console.log(`Inserted Nodes: ${nodesData.length}`);
    console.log(`Inserted Fare Rules: ${fareData.length}`);
    console.log(`Inserted Route Blocks: ${blocksData.length}`);
    console.log('---------------------------------------------------------');

  } catch (error) {
    console.error('Bootstrap failed:', error);
  } finally {
    if (db) await db.end();
  }
}

bootstrapSystem();
