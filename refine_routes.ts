import { query } from './src/lib/mysql';

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function refine() {
  try {
    console.log('Fetching nodes and edges...');
    const nodes = await query('SELECT id, latitude, longitude FROM nodes');
    const edges = await query('SELECT * FROM edges');

    console.log(`Found ${nodes.length} nodes and ${edges.length} edges.`);

    let totalBlocks = 0;
    const decomposedEdges: string[] = [];
    const problematicEdges: string[] = [];

    for (const edge of edges) {
      if (!edge.path_coordinates) {
        console.log(`Skipping edge ${edge.id} (no path)`);
        continue;
      }

      let coords: [number, number][] = [];
      try {
        coords = JSON.parse(edge.path_coordinates);
      } catch (e) {
        console.error(`Error parsing path for edge ${edge.id}`);
        problematicEdges.push(edge.id);
        continue;
      }

      if (coords.length < 2) {
        console.log(`Edge ${edge.id} has insufficient coordinates.`);
        continue;
      }

      // Find intermediate nodes
      // A node is intermediate if it's NOT the source or target, and it's near some point in the path
      const intermediateNodes: { id: string, coordIdx: number }[] = [];

      for (const node of nodes) {
        if (node.id === edge.source || node.id === edge.target) continue;

        // Check proximity to any point in the path (simple approach)
        let minDistance = Infinity;
        let closestIdx = -1;

        for (let i = 0; i < coords.length; i++) {
          const d = getDistance(node.latitude, node.longitude, coords[i][0], coords[i][1]);
          if (d < minDistance) {
            minDistance = d;
            closestIdx = i;
          }
        }

        // If node is within 50 meters of the path
        if (minDistance < 0.05) {
          intermediateNodes.push({ id: node.id, coordIdx: closestIdx });
        }
      }

      // Sort intermediate nodes by their appearance in the coordinate list
      intermediateNodes.sort((a, b) => a.coordIdx - b.coordIdx);

      // Construct segments
      const segments: { source: string, target: string, path: [number, number][], order: number }[] = [];
      let lastNodeId = edge.source;
      let lastCoordIdx = 0;

      for (let i = 0; i < intermediateNodes.length; i++) {
        const node = intermediateNodes[i];
        if (node.coordIdx <= lastCoordIdx) continue; // Avoid duplicate or backward nodes

        segments.push({
          source: lastNodeId,
          target: node.id,
          path: coords.slice(lastCoordIdx, node.coordIdx + 1),
          order: segments.length + 1
        });

        lastNodeId = node.id;
        lastCoordIdx = node.coordIdx;
      }

      // Add final segment
      segments.push({
        source: lastNodeId,
        target: edge.target,
        path: coords.slice(lastCoordIdx),
        order: segments.length + 1
      });

      // Insert segments into route_blocks
      for (const seg of segments) {
        // Calculate segment distance
        let segDist = 0;
        for (let i = 0; i < seg.path.length - 1; i++) {
          segDist += getDistance(seg.path[i][0], seg.path[i][1], seg.path[i+1][0], seg.path[i+1][1]);
        }

        const blockId = `${seg.source}_${seg.target}_${edge.route_name}_${seg.order}`;
        
        await query(`
          INSERT INTO route_blocks (id, source_id, target_id, route_name, distance, regular_fare, path_coordinates, block_order)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE distance=VALUES(distance), path_coordinates=VALUES(path_coordinates)
        `, [
          blockId,
          seg.source,
          seg.target,
          edge.route_name,
          segDist,
          edge.regular_fare, // Simplified: use full fare for now or logic to split? User said fare should be per edge.
          JSON.stringify(seg.path),
          seg.order
        ]);
        totalBlocks++;
      }

      decomposedEdges.push(edge.id);
      console.log(`Decomposed edge ${edge.id} into ${segments.length} blocks.`);
    }

    console.log('Refinement complete.');
    console.log(`Total blocks generated: ${totalBlocks}`);
    console.log(`Successfully decomposed: ${decomposedEdges.length} edges.`);
    console.log(`Problematic edges: ${problematicEdges.length}`);

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

refine();
