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

/**
 * Determines if two route names are compatible (can be ridden as a single continuous ride).
 */
export function areRoutesCompatible(prevRoute: string, nextRoute: string): boolean {
  if (prevRoute === 'NONE' || nextRoute === 'NONE') return false;
  
  const r1 = prevRoute.toLowerCase().trim();
  const r2 = nextRoute.toLowerCase().trim();
  
  if (r1 === r2) return true;

  // Explicitly treat 'ubaldo jeep' or 'palao' as transfers (not compatible)
  if (
    r1.includes('ubaldo') || 
    r2.includes('ubaldo') || 
    r1.includes('palao') || 
    r2.includes('palao')
  ) {
    return false;
  }
  
  // Define compatibility lists
  const tamboRoutes = ['tambo-gerona', 'tambo-gerona-city proper'];
  const cityProperGenericRoutes = [
    'any city proper jeep',
    'any city proper jeep/minibus (except dalipuga)',
    'any city proper jeep/minibus (except buru-un and dalipuga)'
  ];
  
  const isR1Tambo = tamboRoutes.some(r => r1.includes(r));
  const isR2Tambo = tamboRoutes.some(r => r2.includes(r));
  
  const isR1Generic = cityProperGenericRoutes.some(r => r1.includes(r));
  const isR2Generic = cityProperGenericRoutes.some(r => r2.includes(r));
  
  if ((isR1Tambo && isR2Generic) || (isR2Tambo && isR1Generic)) {
    return true;
  }
  
  if (isR1Tambo && isR2Tambo) {
    return true;
  }
  
  return false;
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
  const blocks = await query<RouteBlock[]>('SELECT * FROM route_blocks WHERE is_archived = 0 AND is_history = 0');
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
        if (!areRoutesCompatible(lastRoute, edge.route_name)) {
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
      if (isVehicle && !areRoutesCompatible(lastRoute, edge.route_name)) {
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

/**
 * Implements standard, unconstrained Dijkstra's algorithm.
 * Minimizes strictly physical distance without transfer or ride limit constraints.
 */
function getLegsKey(path: RouteBlock[]): string {
  const legs: { from: string; to: string; routeName: string }[] = [];
  for (const block of path) {
    const isVehicle = isVehicleRide(block.route_name);
    if (legs.length > 0 && isVehicle && areRoutesCompatible(legs[legs.length - 1].routeName, block.route_name)) {
      legs[legs.length - 1].to = block.target_id;
    } else {
      legs.push({
        from: block.source_id,
        to: block.target_id,
        routeName: block.route_name,
      });
    }
  }
  return legs.map(l => `${l.from}->${l.to}:${l.routeName}`).join('|');
}

function runPhysicalDijkstra(
  startNodeId: string,
  endNodeId: string,
  normalizedBlocks: RouteBlock[],
  disabledPhysicalEdges: Set<string>, // u->v
  disabledRouteNames: Set<string>
) {
  const adjacencyList: Record<string, RouteBlock[]> = {};
  const nodes = new Set<string>();

  normalizedBlocks.forEach(block => {
    if (disabledRouteNames.has(block.route_name)) {
      return;
    }
    if (!adjacencyList[block.source_id]) adjacencyList[block.source_id] = [];
    adjacencyList[block.source_id].push(block);
    nodes.add(block.source_id);
    nodes.add(block.target_id);
  });

  if (!nodes.has(startNodeId) || !nodes.has(endNodeId)) return null;

  const weights: Record<string, number> = {};
  const previousNode: Record<string, string | null> = {};
  const pq: { nodeId: string; weight: number }[] = [];

  weights[startNodeId] = 0;
  previousNode[startNodeId] = null;
  pq.push({ nodeId: startNodeId, weight: 0 });

  while (pq.length > 0) {
    pq.sort((a, b) => a.weight - b.weight);
    const { nodeId: u, weight: d } = pq.shift()!;

    if (d > (weights[u] ?? Infinity)) continue;
    if (u === endNodeId) continue;

    const neighbors = adjacencyList[u] || [];
    const neighborsMap: Record<string, number> = {};
    neighbors.forEach(block => {
      const v = block.target_id;
      if (disabledPhysicalEdges.has(`${u}->${v}`)) {
        return;
      }
      const dist = block.distance;
      if (neighborsMap[v] === undefined || dist < neighborsMap[v]) {
        neighborsMap[v] = dist;
      }
    });

    for (const v of Object.keys(neighborsMap)) {
      const weight = neighborsMap[v];
      const newWeight = d + weight;
      if (newWeight < (weights[v] ?? Infinity)) {
        weights[v] = newWeight;
        previousNode[v] = u;
        pq.push({ nodeId: v, weight: newWeight });
      }
    }
  }

  if (weights[endNodeId] === undefined || weights[endNodeId] === Infinity) return null;

  const nodePath: string[] = [];
  let currNode: string | null = endNodeId;
  while (currNode !== null) {
    nodePath.unshift(currNode);
    currNode = previousNode[currNode] !== undefined ? previousNode[currNode]! : null;
  }

  const stepsCandidates: RouteBlock[][] = [];
  for (let i = 0; i < nodePath.length - 1; i++) {
    const u = nodePath[i];
    const v = nodePath[i + 1];
    const candidates = (adjacencyList[u] || []).filter(b => b.target_id === v);
    if (candidates.length === 0) return null;
    stepsCandidates.push(candidates);
  }

  const dp: { minTransfers: number; prevCandidateIndex: number }[][] = [];
  for (let i = 0; i < stepsCandidates.length; i++) {
    dp.push([]);
  }

  for (let j = 0; j < stepsCandidates[0].length; j++) {
    dp[0].push({ minTransfers: 0, prevCandidateIndex: -1 });
  }

  for (let i = 1; i < stepsCandidates.length; i++) {
    const prevCandidates = stepsCandidates[i - 1];
    const currCandidates = stepsCandidates[i];

    for (let j = 0; j < currCandidates.length; j++) {
      const currBlock = currCandidates[j];
      let bestMinTransfers = Infinity;
      let bestPrevIndex = -1;

      for (let p = 0; p < prevCandidates.length; p++) {
        const prevBlock = prevCandidates[p];
        const prevDp = dp[i - 1][p];

        const prevIsVehicle = isVehicleRide(prevBlock.route_name);
        const currIsVehicle = isVehicleRide(currBlock.route_name);

        let transfersAdded = 0;
        if (prevIsVehicle && currIsVehicle) {
          if (!areRoutesCompatible(prevBlock.route_name, currBlock.route_name)) {
            transfersAdded = 1;
          }
        }

        const totalTransfers = prevDp.minTransfers + transfersAdded;
        if (totalTransfers < bestMinTransfers) {
          bestMinTransfers = totalTransfers;
          bestPrevIndex = p;
        }
      }

      dp[i].push({ minTransfers: bestMinTransfers, prevCandidateIndex: bestPrevIndex });
    }
  }

  const lastStepIndex = stepsCandidates.length - 1;
  let minLastTransfers = Infinity;
  let bestLastCandidateIndex = -1;

  for (let j = 0; j < stepsCandidates[lastStepIndex].length; j++) {
    if (dp[lastStepIndex][j].minTransfers < minLastTransfers) {
      minLastTransfers = dp[lastStepIndex][j].minTransfers;
      bestLastCandidateIndex = j;
    }
  }

  if (bestLastCandidateIndex === -1) return null;

  const path: RouteBlock[] = [];
  let currCandidateIndex = bestLastCandidateIndex;
  for (let i = lastStepIndex; i >= 0; i--) {
    path.unshift(stepsCandidates[i][currCandidateIndex]);
    currCandidateIndex = dp[i][currCandidateIndex].prevCandidateIndex;
  }

  return {
    path,
    totalDistance: weights[endNodeId],
    totalFare: path.reduce((sum, b) => sum + Number(b.regular_fare), 0),
  };
}

/**
 * Implements standard, unconstrained Dijkstra's algorithm.
 * Minimizes strictly physical distance without transfer or ride limit constraints.
 */
export async function findRawDijkstraPath(startNodeId: string, endNodeId: string) {
  const blocks = await query<RouteBlock[]>('SELECT * FROM route_blocks WHERE is_archived = 0 AND is_history = 0');
  if (blocks.length === 0) return null;

  const normalizedBlocks = blocks.map(b => ({
    ...b,
    distance: Number(b.distance),
    regular_fare: Number(b.regular_fare),
  }));

  // 1. Primary Route (Dijkstra on all edges)
  const primaryResult = runPhysicalDijkstra(startNodeId, endNodeId, normalizedBlocks, new Set<string>(), new Set<string>());
  if (!primaryResult) return null;

  const primaryLegsKey = getLegsKey(primaryResult.path);
  const uniquePaths = new Map<string, typeof primaryResult>();

  function getTransitLines(p: RouteBlock[]): string[] {
    return p
      .map(b => b.route_name)
      .filter(name => isVehicleRide(name));
  }

  // Strategy A (Detours): Temporarily disable each physical edge in the primary path one-by-one
  for (let i = 0; i < primaryResult.path.length; i++) {
    const block = primaryResult.path[i];
    const disabledEdges = new Set<string>([`${block.source_id}->${block.target_id}`]);
    const altResult = runPhysicalDijkstra(startNodeId, endNodeId, normalizedBlocks, disabledEdges, new Set<string>());
    if (altResult) {
      const key = getLegsKey(altResult.path);
      if (key !== primaryLegsKey && !uniquePaths.has(key)) {
        uniquePaths.set(key, altResult);
      }
    }
  }

  // Strategy B (Alternative Lines): Disable entire transit lines used in the primary path
  const primaryTransitLines = new Set(getTransitLines(primaryResult.path));
  if (primaryTransitLines.size > 0) {
    const altResult = runPhysicalDijkstra(startNodeId, endNodeId, normalizedBlocks, new Set<string>(), primaryTransitLines);
    if (altResult) {
      const key = getLegsKey(altResult.path);
      if (key !== primaryLegsKey && !uniquePaths.has(key)) {
        uniquePaths.set(key, altResult);
      }
    }
  }

  // Strategy C (Combined Disabling): Disable primary route lines + first alternative lines
  if (uniquePaths.size < 3) {
    const sortedAltsSoFar = Array.from(uniquePaths.values()).sort((a, b) => a.totalDistance - b.totalDistance);
    if (sortedAltsSoFar.length > 0) {
      const alt1 = sortedAltsSoFar[0];
      const combinedDisabledLines = new Set<string>([
        ...primaryTransitLines,
        ...getTransitLines(alt1.path)
      ]);
      const altResult = runPhysicalDijkstra(startNodeId, endNodeId, normalizedBlocks, new Set<string>(), combinedDisabledLines);
      if (altResult) {
        const key = getLegsKey(altResult.path);
        if (key !== primaryLegsKey && !uniquePaths.has(key)) {
          uniquePaths.set(key, altResult);
        }
      }
    }
  }

  // Deduplicate and Sort unique candidates by total distance, returning top 3
  const sortedAlternatives = Array.from(uniquePaths.values())
    .sort((a, b) => a.totalDistance - b.totalDistance)
    .slice(0, 3);

  return {
    ...primaryResult,
    alternatives: sortedAlternatives,
  };
}
