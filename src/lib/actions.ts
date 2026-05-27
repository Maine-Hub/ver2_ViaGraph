'use server';

import { z } from 'zod';
import { query } from '@/lib/mysql';
import type { ShortestPathResult, PathSegment } from '@/lib/types';
import { calculateFare, calculateDiscountedFare, type VehicleType } from './fare';
import { findShortestPath } from './routing';


const FindRouteSchema = z.object({
  startLocation: z.string().min(1, 'Please select a starting location.'),
  endLocation: z.string().min(1, 'Please select a destination.'),
});

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

export type FormState = {
  message: string;
  result?: ShortestPathResult;
  error?: boolean;
};

export async function findRouteAction(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const startLoc = formData.get('startLocation');
  const endLoc = formData.get('endLocation');
  console.log('findRouteAction called. formData:', { startLoc, endLoc });

  const validatedFields = FindRouteSchema.safeParse({
    startLocation: startLoc,
    endLocation: endLoc,
  });

  if (!validatedFields.success) {
    return { message: 'Invalid input.', error: true };
  }

  const { startLocation, endLocation } = validatedFields.data;

  if (startLocation === endLocation) {
    return { message: 'Start and end locations cannot be the same.', error: true };
  }

  try {
    // --- Phase 2: Dijkstra Implementation ---
    console.log(`Searching for path via Dijkstra: ${startLocation} -> ${endLocation}`);
    const dijkstraResult = await findShortestPath(startLocation, endLocation);

    if (dijkstraResult) {
      console.log('Dijkstra path found! Path length:', dijkstraResult.path.length, ' | Edges:', dijkstraResult.path.map(b => `${b.source_id}->${b.target_id}`));
      
      // Fetch node names for display
      const allNodeIds = new Set<string>();
      dijkstraResult.path.forEach(b => {
        allNodeIds.add(b.source_id);
        allNodeIds.add(b.target_id);
      });
      
      const allNodeIdsArray = Array.from(allNodeIds);
      let nodeNameMap: Record<string, string> = {};
      if (allNodeIdsArray.length > 0) {
        const placeholders = allNodeIdsArray.map(() => '?').join(',');
        const nodes = await query<any[]>(`SELECT id, name FROM nodes WHERE id IN (${placeholders})`, allNodeIdsArray);
        nodes.forEach(n => nodeNameMap[n.id] = n.name);
      }

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
            last.regularFare = calculateFare(last.distance, (last.vehicleType || 'jeepney') as VehicleType);
            last.discountedFare = calculateDiscountedFare(last.distance, (last.vehicleType || 'jeepney') as VehicleType);

            // Merge path coordinates safely
            if (last.pathCoordinates || coords) {
              const lastNormalized = last.pathCoordinates && last.pathCoordinates.ridingCoords 
                ? last.pathCoordinates 
                : normalizeCoords(last.pathCoordinates);
              const nextNormalized = normalizeCoords(coords);
              last.pathCoordinates = mergeNormalizedCoords(lastNormalized, nextNormalized);
            }

            // Merge notes safely
            if (b.note) {
              last.note = last.note ? `${last.note}; ${b.note}` : b.note;
            }
          } else {
            // New segment
            let regFare = 0;
            let discFare = 0;
            const currentVehicleType = (b.vehicle_type || 'jeepney') as VehicleType;
            if (isVehicle) {
              regFare = calculateFare(Number(b.distance), currentVehicleType);
              discFare = calculateDiscountedFare(Number(b.distance), currentVehicleType);
            }

            segments.push({
              from: nodeNameMap[b.source_id] || b.source_id,
              to: nodeNameMap[b.target_id] || b.target_id,
              routeName: b.route_name,
              distance: Number(b.distance),
              vehicleType: currentVehicleType,
              regularFare: regFare,
              discountedFare: discFare,
              pathCoordinates: coords ? normalizeCoords(coords) : null,
              note: b.note || '',
            });
          }
        }
        return segments;
      };

      const path = processPath(dijkstraResult.path);
      const alternatives = (dijkstraResult.alternatives || []).map((alt: any) => {
        const altPath = processPath(alt.path);
        return {
          path: altPath,
          totalDistance: alt.totalDistance,
          totalFare: altPath.reduce((sum: number, p: any) => sum + (p.regularFare || 0), 0),
          discountedFare: altPath.reduce((sum: number, p: any) => sum + (p.discountedFare || 0), 0),
        };
      });

      return {
        message: 'Route found via Dijkstra.',
        result: {
          path,
          totalDistance: dijkstraResult.totalDistance,
          totalFare: path.reduce((sum: number, p: any) => sum + (p.regularFare || 0), 0),
          discountedFare: path.reduce((sum: number, p: any) => sum + (p.discountedFare || 0), 0),
          alternatives
        }
      };
    }

    console.log('No Dijkstra path found. No route available.');
    return { message: 'No route found between the selected locations.', error: true };

  } catch (error) {
    console.error('findRouteAction error:', error);
    return { message: 'An error occurred while searching for a route.', error: true };
  }
}
