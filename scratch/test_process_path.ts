import { findShortestPath } from '../src/lib/routing';
import { calculateFare, calculateDiscountedFare } from '../src/lib/fare';

// Helper functions from actions.ts
interface NormalizedCoords {
  ridingCoords: [number, number][];
  walkingCoords: [number, number][];
  ridingDist: number;
  walkingDist: number;
}

function normalizeCoords(coords: any): NormalizedCoords {
  if (!coords) {
    return { ridingCoords: [], walkingCoords: [], ridingDist: 0, walkingDist: 0 };
  }
  if (Array.isArray(coords)) {
    return {
      ridingCoords: coords,
      walkingCoords: [],
      ridingDist: 0,
      walkingDist: 0,
    };
  }
  return {
    ridingCoords: Array.isArray(coords.ridingCoords) ? coords.ridingCoords : [],
    walkingCoords: Array.isArray(coords.walkingCoords) ? coords.walkingCoords : [],
    ridingDist: Number(coords.ridingDist || 0),
    walkingDist: Number(coords.walkingDist || 0),
  };
}

function mergeNormalizedCoords(c1: NormalizedCoords, c2: NormalizedCoords): NormalizedCoords {
  return {
    ridingCoords: [...c1.ridingCoords, ...c2.ridingCoords],
    walkingCoords: [...c1.walkingCoords, ...c2.walkingCoords],
    ridingDist: c1.ridingDist + c2.ridingDist,
    walkingDist: c1.walkingDist + c2.walkingDist,
  };
}

async function testProcessPath() {
  const dijkstraResult = await findShortestPath('gaisano-mall', 'anahaw-amphitheater');
  if (!dijkstraResult) {
    console.log('No route found');
    process.exit(0);
  }

  const nodeNameMap: Record<string, string> = {
    'gaisano-mall': 'Gaisano Mall',
    'unicity': 'Unicity',
    'anahaw-amphitheater': 'Anahaw Amphitheater'
  };

  const processPath = (blocks: any[]) => {
    const segments: any[] = [];
    for (const b of blocks) {
      let coords: any = null;
      try {
        if (b.path_coordinates) {
          coords = JSON.parse(b.path_coordinates);
        }
      } catch (e) {}

      const isVehicle = b.route_name.toLowerCase() !== 'just walk' && !b.route_name.toLowerCase().includes('walk');

      if (segments.length > 0 && isVehicle && segments[segments.length - 1].routeName === b.route_name) {
        // Merge with previous segment
        const last = segments[segments.length - 1];
        last.to = nodeNameMap[b.target_id] || b.target_id;
        last.distance += Number(b.distance);
        
        // Recalculate fares based on the merged distance
        last.regularFare = calculateFare(last.distance, 'jeepney');
        last.discountedFare = calculateDiscountedFare(last.distance, 'jeepney');

        // Merge path coordinates safely
        if (last.pathCoordinates || coords) {
          const lastNormalized = last.pathCoordinates && last.pathCoordinates.ridingCoords 
            ? last.pathCoordinates 
            : normalizeCoords(last.pathCoordinates);
          const nextNormalized = normalizeCoords(coords);
          last.pathCoordinates = mergeNormalizedCoords(lastNormalized, nextNormalized);
        }
      } else {
        // New segment
        let regFare = 0;
        let discFare = 0;
        if (isVehicle) {
          regFare = calculateFare(Number(b.distance), 'jeepney');
          discFare = calculateDiscountedFare(Number(b.distance), 'jeepney');
        }

        segments.push({
          from: nodeNameMap[b.source_id] || b.source_id,
          to: nodeNameMap[b.target_id] || b.target_id,
          routeName: b.route_name,
          distance: Number(b.distance),
          regularFare: regFare,
          discountedFare: discFare,
          pathCoordinates: coords ? normalizeCoords(coords) : null,
        });
      }
    }
    return segments;
  };

  const processed = processPath(dijkstraResult.path);
  console.log("Processed path segments count:", processed.length);
  console.log(JSON.stringify(processed, null, 2));
  process.exit(0);
}

testProcessPath().catch(console.error);
