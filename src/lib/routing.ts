import { query } from './mysql';

export interface RouteBlock {
  id: string;
  source_id: string;
  target_id: string;
  route_name: string;
  distance: number;
  regular_fare: number;
  path_coordinates: string; // JSON string in DB
  block_order: number;
}

/**
 * Determines if a route name represents a vehicle ride or just walking.
 */
function isVehicleRide(routeName: string): boolean {
  const name = routeName.toLowerCase();
  if (name.includes('walk') && !name.includes('jeep') && !name.includes('bus')) {
    return false;
  }
  if (name === 'just walk') return false;
  return true;
}

interface DijkstraState {
  nodeId: string;
  rideCount: number;
  lastRoute: string;
  edge: RouteBlock;
}

/**
 * Implements Dijkstra's algorithm with a constraint of at most 2 vehicle rides.
 * State is (nodeId, rideCount, lastRouteName).
 */
export async function findShortestPath(startNodeId: string, endNodeId: string) {
  const blocks = await query<RouteBlock[]>('SELECT * FROM route_blocks');
  if (blocks.length === 0) return null;

  // Normalize numeric fields (MySQL may return decimals as strings)
  const normalizedBlocks = blocks.map(b => ({
    ...b,
    distance: Number(b.distance),
    regular_fare: Number(b.regular_fare),
  }));

  const adjacencyList: Record<string, RouteBlock[]> = {};
  const nodes = new Set<string>();

  normalizedBlocks.forEach(block => {
    if (!adjacencyList[block.source_id]) {
      adjacencyList[block.source_id] = [];
    }
    adjacencyList[block.source_id].push(block);
    nodes.add(block.source_id);
    nodes.add(block.target_id);

    // Also add the reverse direction (B → A) so jeepney loops work both ways
    const reverseBlock: RouteBlock = {
      ...block,
      id: `${block.id}_reverse`,
      source_id: block.target_id,
      target_id: block.source_id,
      // Reverse the path coordinates JSON string so the polyline draws correctly
      path_coordinates: (() => {
        try {
          const parsed = JSON.parse(block.path_coordinates);
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            // New structured format { ridingCoords, walkingCoords, ... }
            return JSON.stringify({
              ...parsed,
              ridingCoords: [...(parsed.ridingCoords || [])].reverse(),
              walkingCoords: [...(parsed.walkingCoords || [])].reverse(),
            });
          } else if (Array.isArray(parsed)) {
            // Legacy flat array
            return JSON.stringify([...parsed].reverse());
          }
        } catch {
          // Not valid JSON; return as-is
        }
        return block.path_coordinates;
      })(),
    };

    if (!adjacencyList[reverseBlock.source_id]) {
      adjacencyList[reverseBlock.source_id] = [];
    }
    adjacencyList[reverseBlock.source_id].push(reverseBlock);
  });


  if (!nodes.has(startNodeId) || !nodes.has(endNodeId)) {
    console.log('[Dijkstra] Node not found in graph. startNodeId:', startNodeId, 'has:', nodes.has(startNodeId), '| endNodeId:', endNodeId, 'has:', nodes.has(endNodeId));
    console.log('[Dijkstra] All nodes in graph:', Array.from(nodes));
    return null;
  }

  // distances[nodeId][rideCount][lastRouteName]
  // To keep it simple, since graph is small, we'll use a string key for state: "nodeId|rideCount|lastRoute"
  const distances: Record<string, number> = {};
  const previousState: Record<string, DijkstraState | null> = {};

  // Priority Queue: array of { nodeId, rideCount, lastRoute, dist }
  const pq: { nodeId: string, rideCount: number, lastRoute: string, dist: number }[] = [];

  const startState = `${startNodeId}|0|NONE`;
  distances[startState] = 0;
  pq.push({ nodeId: startNodeId, rideCount: 0, lastRoute: 'NONE', dist: 0 });

  while (pq.length > 0) {
    pq.sort((a, b) => a.dist - b.dist);
    const { nodeId: u, rideCount: rc, lastRoute, dist: d } = pq.shift()!;

    const stateKey = `${u}|${rc}|${lastRoute}`;
    if (d > (distances[stateKey] ?? Infinity)) continue;
    if (u === endNodeId) continue;

    const neighbors = adjacencyList[u] || [];
    for (const edge of neighbors) {
      const isVehicle = isVehicleRide(edge.route_name);

      let nextRc = rc;
      if (isVehicle) {
        // Only increment if it's a DIFFERENT vehicle route than the last one
        if (edge.route_name !== lastRoute) {
          nextRc = rc + 1;
        }
      }

      if (nextRc > 3) continue; // Constraint: Max 3 vehicle rides

      const nextStateKey = `${edge.target_id}|${nextRc}|${edge.route_name}`;
      const newDist = d + edge.distance;

      if (newDist < (distances[nextStateKey] ?? Infinity)) {
        distances[nextStateKey] = newDist;
        previousState[nextStateKey] = { nodeId: u, rideCount: rc, lastRoute, edge };
        pq.push({ nodeId: edge.target_id, rideCount: nextRc, lastRoute: edge.route_name, dist: newDist });
      }
    }
  }

  // Find the best state at the destination
  let bestStateKey: string | null = null;
  let minTotalDist = Infinity;

  Object.keys(distances).forEach(key => {
    if (key.startsWith(`${endNodeId}|`)) {
      if (distances[key] < minTotalDist) {
        minTotalDist = distances[key];
        bestStateKey = key;
      }
    }
  });

  console.log('[Dijkstra] States found at destination:', Object.keys(distances).filter(k => k.startsWith(`${endNodeId}|`)));
  console.log('[Dijkstra] Total states explored:', Object.keys(distances).length);
  console.log('[Dijkstra] Adjacency list keys:', Object.keys(adjacencyList));

  if (!bestStateKey || minTotalDist === Infinity) return null;

  // Use a narrowed constant to help TS inference
  const resultStateKey: string = bestStateKey;

  // Reconstruct path
  const path: RouteBlock[] = [];
  let currStateKey: string | null = resultStateKey;

  while (currStateKey && previousState[currStateKey]) {
    const stateObj: DijkstraState = previousState[currStateKey]!;
    path.unshift(stateObj.edge);
    currStateKey = `${stateObj.nodeId}|${stateObj.rideCount}|${stateObj.lastRoute}`;
  }

  const finalRideCount = parseInt(resultStateKey.split('|')[1]);
  const shortestResult = {
    path,
    totalDistance: minTotalDist,
    totalFare: path.reduce((sum, b) => sum + Number(b.regular_fare), 0),
    rideCount: finalRideCount
  };

  // Find Alternative Paths using a simple DFS with limits
  const alternatives = await findAllPaths(startNodeId, endNodeId, blocks, minTotalDist);

  return {
    ...shortestResult,
    alternatives: alternatives.filter(alt => JSON.stringify(alt.path) !== JSON.stringify(path))
  };
}

/**
 * Finds all simple paths with at most 2 vehicle rides.
 * We limit the search to avoid combinatorial explosion.
 */
async function findAllPaths(startNodeId: string, endNodeId: string, blocks: RouteBlock[], minDistance: number) {
  const normalizedBlocks = blocks.map(b => ({ ...b, distance: Number(b.distance), regular_fare: Number(b.regular_fare) }));
  const adjacencyList: Record<string, RouteBlock[]> = {};
  normalizedBlocks.forEach(block => {
    if (!adjacencyList[block.source_id]) adjacencyList[block.source_id] = [];
    adjacencyList[block.source_id].push(block);

    // Bidirectional: add reverse edge
    const reverseBlock: RouteBlock = {
      ...block,
      id: `${block.id}_reverse`,
      source_id: block.target_id,
      target_id: block.source_id,
      path_coordinates: (() => {
        try {
          const parsed = JSON.parse(block.path_coordinates);
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            return JSON.stringify({ ...parsed, ridingCoords: [...(parsed.ridingCoords || [])].reverse(), walkingCoords: [...(parsed.walkingCoords || [])].reverse() });
          } else if (Array.isArray(parsed)) {
            return JSON.stringify([...parsed].reverse());
          }
        } catch { /* ignore */ }
        return block.path_coordinates;
      })(),
    };
    if (!adjacencyList[reverseBlock.source_id]) adjacencyList[reverseBlock.source_id] = [];
    adjacencyList[reverseBlock.source_id].push(reverseBlock);
  });


  const allPaths: any[] = [];
  const maxDistance = minDistance * 2.5; // Only show paths that aren't too much longer

  function dfs(u: string, rideCount: number, lastRoute: string, currentPath: RouteBlock[], currentDist: number, visited: Set<string>) {
    if (u === endNodeId) {
      if (currentPath.length > 0) {
        allPaths.push({
          path: [...currentPath],
          totalDistance: currentDist,
          totalFare: currentPath.reduce((sum, b) => sum + Number(b.regular_fare), 0),
          rideCount
        });
      }
      return;
    }

    if (currentDist > maxDistance) return;
    if (allPaths.length > 10) return; // Limit number of alternatives

    const neighbors = adjacencyList[u] || [];
    for (const edge of neighbors) {
      if (visited.has(edge.target_id)) continue;

      const isVehicle = isVehicleRide(edge.route_name);
      let nextRc = rideCount;
      if (isVehicle && edge.route_name !== lastRoute) {
        nextRc++;
      }

      if (nextRc > 3) continue;

      visited.add(edge.target_id);
      dfs(edge.target_id, nextRc, edge.route_name, [...currentPath, edge], currentDist + edge.distance, visited);
      visited.delete(edge.target_id);
    }
  }

  dfs(startNodeId, 0, 'NONE', [], 0, new Set([startNodeId]));

  // Sort by distance and take top alternatives
  return allPaths.sort((a, b) => a.totalDistance - b.totalDistance).slice(0, 5);
}
