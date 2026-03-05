import type { Edge, Location, ShortestPathResult, PathSegment } from './types';

export function findShortestPath(
  nodes: Location[],
  edges: Edge[],
  startNodeId: string,
  endNodeId: string
): ShortestPathResult | null {
  const distances: { [key: string]: number } = {};
  const previousNodes: { [key: string]: { nodeId: string; edge: Edge } | null } = {};
  const queue: Set<string> = new Set();
  const locationMap = new Map(nodes.map((node) => [node.id, node]));

  nodes.forEach(node => {
    distances[node.id] = Infinity;
    previousNodes[node.id] = null;
    queue.add(node.id);
  });

  distances[startNodeId] = 0;

  while (queue.size > 0) {
    let u: string | null = null;
    let minDistance = Infinity;

    for (const nodeId of queue) {
      if (distances[nodeId] < minDistance) {
        minDistance = distances[nodeId];
        u = nodeId;
      }
    }

    if (u === null) {
      break;
    }

    queue.delete(u);

    if (u === endNodeId) {
      break;
    }

    const neighbors = edges.filter(edge => edge.source === u);

    for (const edge of neighbors) {
      const v = edge.target;
      const alt = distances[u] + edge.weight;

      if (alt < distances[v]) {
        distances[v] = alt;
        previousNodes[v] = { nodeId: u, edge };
      }
    }
  }

  const path: PathSegment[] = [];
  let current = endNodeId;

  if (previousNodes[current] === null && current !== startNodeId) {
    return null; // No path found
  }

  while (current !== startNodeId && previousNodes[current]) {
    const prev = previousNodes[current];
    if (!prev) break;
    const { nodeId: prevNodeId, edge } = prev;

    const fromLocation = locationMap.get(prevNodeId);
    const toLocation = locationMap.get(current);

    if (fromLocation && toLocation) {
      path.unshift({
        from: fromLocation.name,
        to: toLocation.name,
        routeName: edge.routeName,
        distance: edge.weight,
      });
    }
    current = prevNodeId;
  }

  if (path.length === 0 && startNodeId !== endNodeId) {
    return null;
  }

  return {
    path,
    totalDistance: distances[endNodeId],
  };
}
