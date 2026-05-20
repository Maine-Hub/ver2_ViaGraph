'use server';

import { z } from 'zod';
import { query } from '@/lib/mysql';
import type { ShortestPathResult, PathSegment } from '@/lib/types';
import { calculateFare, calculateDiscountedFare } from './fare';
import { findShortestPath } from './routing';


const FindRouteSchema = z.object({
  startLocation: z.string().min(1, 'Please select a starting location.'),
  endLocation: z.string().min(1, 'Please select a destination.'),
});

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
        return blocks.map(b => {
          let coords: [number, number][] | null = null;
          try {
            if (b.path_coordinates) {
              coords = JSON.parse(b.path_coordinates);
            }
          } catch (e) {}

          return {
            from: nodeNameMap[b.source_id] || b.source_id,
            to: nodeNameMap[b.target_id] || b.target_id,
            routeName: b.route_name,
            distance: b.distance,
            regularFare: Number(b.regular_fare),
            discountedFare: Number(b.regular_fare) * 0.8,
            pathCoordinates: coords,
          };
        });
      };

      const path = processPath(dijkstraResult.path);
      const alternatives = (dijkstraResult.alternatives || []).map((alt: any) => ({
        path: processPath(alt.path),
        totalDistance: alt.totalDistance,
        totalFare: alt.totalFare,
        discountedFare: alt.totalFare * 0.8,
      }));

      return {
        message: 'Route found via Dijkstra.',
        result: {
          path,
          totalDistance: dijkstraResult.totalDistance,
          totalFare: dijkstraResult.totalFare,
          discountedFare: path.reduce((sum, p: any) => sum + (p.discountedFare || 0), 0),
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
