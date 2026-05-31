import { query } from './mysql';

export interface RouteBlock {
  id: string;
  source_id: string;
  target_id: string;
  route_name: string;
  vehicle_type: string;
  distance: number;
  regular_fare: number;
  path_coordinates: string; // JSON string in DB
  block_order: number;
  note?: string;
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
  const blocks = await query<RouteBlock[]>('SELECT * FROM route_blocks WHERE is_archived = 0');
  if (blocks.length === 0) return null;

  // Normalize numeric fields (MySQL may return decimals as strings)
  const normalizedBlocks = blocks.map(b => ({
    ...b,
    distance: Number(b.distance),
    regular_fare: Number(b.regular_fare),
  }));

  const adjacencyList: Record<string, RouteBlock[]> = {};
  const nodes = new Set<string>();

  // Track explicit directed edges in the database
  const explicitEdges = new Set<string>();
  normalizedBlocks.forEach(block => {
    explicitEdges.add(`${block.source_id}->${block.target_id}`);
  });

  normalizedBlocks.forEach(block => {
    if (!adjacencyList[block.source_id]) {
      adjacencyList[block.source_id] = [];
    }
    adjacencyList[block.source_id].push(block);
    nodes.add(block.source_id);
    nodes.add(block.target_id);

    // Only add automatic reverse direction (B → A) if there is no explicit path from B to A in the database
    if (!explicitEdges.has(`${block.target_id}->${block.source_id}`)) {
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
    }
  });


  if (!nodes.has(startNodeId) || !nodes.has(endNodeId)) {
    console.log('[Dijkstra] Node not found in graph. startNodeId:', startNodeId, 'has:', nodes.has(startNodeId), '| endNodeId:', endNodeId, 'has:', nodes.has(endNodeId));
    console.log('[Dijkstra] All nodes in graph:', Array.from(nodes));
    return null;
  }

  // weights[nodeId][rideCount][lastRouteName] stores the cumulative Dijkstra weight
  const weights: Record<string, number> = {};
  const actualDistances: Record<string, number> = {}; // Tracks true physical distance
  const previousState: Record<string, DijkstraState | null> = {};

  // Priority Queue: array of { nodeId, rideCount, lastRoute, weight, actualDist }
  const pq: { nodeId: string, rideCount: number, lastRoute: string, weight: number, actualDist: number }[] = [];

  const startState = `${startNodeId}|0|NONE`;
  weights[startState] = 0;
  actualDistances[startState] = 0;
  pq.push({ nodeId: startNodeId, rideCount: 0, lastRoute: 'NONE', weight: 0, actualDist: 0 });

  while (pq.length > 0) {
    pq.sort((a, b) => a.weight - b.weight);
    const { nodeId: u, rideCount: rc, lastRoute, weight: d, actualDist: dAct } = pq.shift()!;

    const stateKey = `${u}|${rc}|${lastRoute}`;
    if (d > (weights[stateKey] ?? Infinity)) continue;
    if (u === endNodeId) continue;

    const neighbors = adjacencyList[u] || [];
    for (const edge of neighbors) {
      const isVehicle = isVehicleRide(edge.route_name);

      let nextRc = rc;
      let penalty = 0;
      if (isVehicle) {
        if (edge.route_name !== lastRoute) {
          nextRc = rc + 1;
          if (lastRoute !== 'NONE' && isVehicleRide(lastRoute)) {
            // Tiny penalty (10m) to break ties in favor of staying on the same vehicle without affecting primary distance optimization
            penalty = 0.01;
          }
        }
      }

      if (nextRc > 2) continue; 

      const nextStateKey = `${edge.target_id}|${nextRc}|${edge.route_name}`;
      const newWeight = d + edge.distance + penalty;
      const newActualDist = dAct + edge.distance;

      if (newWeight < (weights[nextStateKey] ?? Infinity)) {
        weights[nextStateKey] = newWeight;
        actualDistances[nextStateKey] = newActualDist;
        previousState[nextStateKey] = { nodeId: u, rideCount: rc, lastRoute, edge };
        pq.push({ nodeId: edge.target_id, rideCount: nextRc, lastRoute: edge.route_name, weight: newWeight, actualDist: newActualDist });
      }
    }
  }

  // Find the best state at the destination
  let bestStateKey: string | null = null;
  let minTotalWeight = Infinity;

  Object.keys(weights).forEach(key => {
    if (key.startsWith(`${endNodeId}|`)) {
      if (weights[key] < minTotalWeight) {
        minTotalWeight = weights[key];
        bestStateKey = key;
      }
    }
  });

  console.log('[Dijkstra] States found at destination:', Object.keys(weights).filter(k => k.startsWith(`${endNodeId}|`)));
  console.log('[Dijkstra] Total states explored:', Object.keys(weights).length);
  console.log('[Dijkstra] Adjacency list keys:', Object.keys(adjacencyList));

  if (!bestStateKey || minTotalWeight === Infinity) return null;

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
  const actualFinalDistance = actualDistances[resultStateKey];
  const shortestResult = {
    path,
    totalDistance: actualFinalDistance,
    totalFare: path.reduce((sum, b) => sum + Number(b.regular_fare), 0),
    rideCount: finalRideCount
  };

  // Find Alternative Paths using a simple DFS with limits
  const alternatives = await findAllPaths(startNodeId, endNodeId, blocks, minTotalWeight);

  return {
    ...shortestResult,
    alternatives: alternatives.filter(alt => JSON.stringify(alt.path) !== JSON.stringify(path))
  };
}

/**
 * Finds all simple paths with at most 2 vehicle rides.
 * We limit the search to avoid combinatorial explosion.
 */
async function findAllPaths(startNodeId: string, endNodeId: string, blocks: RouteBlock[], minWeight: number) {
  const normalizedBlocks = blocks.map(b => ({ ...b, distance: Number(b.distance), regular_fare: Number(b.regular_fare) }));
  const adjacencyList: Record<string, RouteBlock[]> = {};

  const explicitEdges = new Set<string>();
  normalizedBlocks.forEach(block => {
    explicitEdges.add(`${block.source_id}->${block.target_id}`);
  });

  normalizedBlocks.forEach(block => {
    if (!adjacencyList[block.source_id]) adjacencyList[block.source_id] = [];
    adjacencyList[block.source_id].push(block);

    // Bidirectional fallback: only add reverse edge if no explicit reverse edge exists
    if (!explicitEdges.has(`${block.target_id}->${block.source_id}`)) {
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
    }
  });


  const allPaths: any[] = [];
  const maxWeight = minWeight * 2.5; 

  function dfs(u: string, rideCount: number, lastRoute: string, currentPath: RouteBlock[], currentWeight: number, currentActualDist: number, visited: Set<string>) {
    if (u === endNodeId) {
      if (currentPath.length > 0) {
        allPaths.push({
          path: [...currentPath],
          totalDistance: currentActualDist,
          totalWeight: currentWeight,
          totalFare: currentPath.reduce((sum, b) => sum + Number(b.regular_fare), 0),
          rideCount
        });
      }
      return;
    }

    if (currentWeight > maxWeight) return;
    if (allPaths.length > 10) return; // Limit number of alternatives

    const neighbors = adjacencyList[u] || [];
    for (const edge of neighbors) {
      if (visited.has(edge.target_id)) continue;

      const isVehicle = isVehicleRide(edge.route_name);
      let nextRc = rideCount;
      let penalty = 0;
      if (isVehicle && edge.route_name !== lastRoute) {
        nextRc++;
        if (lastRoute !== 'NONE' && isVehicleRide(lastRoute)) {
          penalty = 0.01;
        }
      }

      if (nextRc > 2) continue; 

      visited.add(edge.target_id);
      dfs(edge.target_id, nextRc, edge.route_name, [...currentPath, edge], currentWeight + edge.distance + penalty, currentActualDist + edge.distance, visited);
      visited.delete(edge.target_id);
    }
  }

  dfs(startNodeId, 0, 'NONE', [], 0, 0, new Set([startNodeId]));

  // Sort by weight and take top alternatives
  return allPaths.sort((a, b) => a.totalWeight - b.totalWeight).slice(0, 5);
}
