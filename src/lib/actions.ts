'use server';

import { z } from 'zod';
import { query } from '@/lib/mysql';
import type { ShortestPathResult, PathSegment } from '@/lib/types';
import { calculateFare, calculateDiscountedFare, type VehicleType, type FareRule } from './fare';
import { findShortestPath, findRawDijkstraPath, areRoutesCompatible } from './routing';


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
    let rawDijkstraPath = null;

    // Load fare rules from database
    const dbRules = await query<any[]>('SELECT * FROM fare_matrix');
    const fareRulesMap: Record<string, FareRule> = {};
    dbRules.forEach(r => {
      fareRulesMap[r.vehicle_type] = {
        vehicle_type: r.vehicle_type,
        base_fare: Number(r.base_fare),
        first_km: Number(r.base_km),
        succeeding_km_fare: Number(r.succeeding_km_rate),
        discount_percentage: Number(r.discount_rate),
      };
    });

    // Try computing raw dijkstra path first to see if it is available
    let rawDijkstraRes = null;
    try {
      rawDijkstraRes = await findRawDijkstraPath(startLocation, endLocation);
    } catch (err) {
      console.error('Failed to compute raw Dijkstra comparison path:', err);
    }

    if (!dijkstraResult && !rawDijkstraRes) {
      console.log('No Dijkstra path found. No route available.');
      return { message: 'No route found between the selected locations.', error: true };
    }

    // Fetch node names for display (collect all node IDs from both paths)
    const allNodeIds = new Set<string>();
    if (dijkstraResult) {
      dijkstraResult.path.forEach(b => {
        allNodeIds.add(b.source_id);
        allNodeIds.add(b.target_id);
      });
    }
    if (rawDijkstraRes) {
      rawDijkstraRes.path.forEach(b => {
        allNodeIds.add(b.source_id);
        allNodeIds.add(b.target_id);
      });
    }
    
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

        if (segments.length > 0 && isVehicle && areRoutesCompatible(segments[segments.length - 1].routeName, b.route_name)) {
          // Merge with previous segment
          const last = segments[segments.length - 1];
          last.to = nodeNameMap[b.target_id] || b.target_id;
          last.distance += Number(b.distance);
          
          // Prefer the more specific route name in the merged segment
          const prevLower = last.routeName.toLowerCase();
          const nextLower = b.route_name.toLowerCase();
          if (prevLower.includes('any city proper') && !nextLower.includes('any city proper')) {
            last.routeName = b.route_name;
          }
          
          // Recalculate fares based on the merged distance using dynamic fare rules
          const specificRule = fareRulesMap[last.vehicleType || 'jeepney'];
          last.regularFare = calculateFare(last.distance, (last.vehicleType || 'jeepney') as VehicleType, specificRule);
          last.discountedFare = calculateDiscountedFare(last.distance, (last.vehicleType || 'jeepney') as VehicleType, specificRule);

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
            const specificRule = fareRulesMap[currentVehicleType];
            regFare = calculateFare(Number(b.distance), currentVehicleType, specificRule);
            discFare = calculateDiscountedFare(Number(b.distance), currentVehicleType, specificRule);
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

    // Process raw Dijkstra path for comparison
    if (rawDijkstraRes) {
      const rawPath = processPath(rawDijkstraRes.path);
      const rawAlts = (rawDijkstraRes.alternatives || []).map((alt: any) => {
        const altPath = processPath(alt.path);
        return {
          path: altPath,
          totalDistance: alt.totalDistance,
          totalFare: altPath.reduce((sum: number, p: any) => sum + (p.regularFare || 0), 0),
          discountedFare: altPath.reduce((sum: number, p: any) => sum + (p.discountedFare || 0), 0),
          rideCount: altPath.filter((p: any) => p.routeName.toLowerCase() !== 'just walk' && !p.routeName.toLowerCase().includes('walk')).length,
        };
      });
      rawDijkstraPath = {
        path: rawPath,
        totalDistance: rawDijkstraRes.totalDistance,
        totalFare: rawPath.reduce((sum: number, p: any) => sum + (p.regularFare || 0), 0),
        discountedFare: rawPath.reduce((sum: number, p: any) => sum + (p.discountedFare || 0), 0),
        rideCount: rawPath.filter((p: any) => p.routeName.toLowerCase() !== 'just walk' && !p.routeName.toLowerCase().includes('walk')).length,
        alternatives: rawAlts,
      };
    }

    if (dijkstraResult) {
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
          alternatives,
          rawDijkstraPath
        }
      };
    } else {
      return {
        message: 'No route found between the selected locations.',
        result: {
          path: [],
          totalDistance: 0,
          totalFare: 0,
          discountedFare: 0,
          alternatives: [],
          rawDijkstraPath
        }
      };
    }

  } catch (error) {
    console.error('findRouteAction error:', error);
    return { message: 'An error occurred while searching for a route.', error: true };
  }
}
