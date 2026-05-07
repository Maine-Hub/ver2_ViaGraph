'use server';

import { z } from 'zod';
import { query } from '@/lib/mysql';
import type { ShortestPathResult, PathSegment } from '@/lib/types';
import { calculateFare, calculateDiscountedFare } from './fare';

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
    // 1. Look for direct edges between the two nodes
    const [rawNodes, rawEdges] = await Promise.all([
      query<any[]>('SELECT id, name FROM nodes WHERE id IN (?, ?)', [startLocation, endLocation]),
      query<any[]>(
        `SELECT source, target, distance, route_name AS routeName,
                stop_and_transfer AS stopAndTransfer, note,
                regular_fare AS regularFare, discounted_fare AS discountedFare,
                path_coordinates AS pathCoordinatesJson
         FROM edges
         WHERE (source = ? AND target = ?) OR (source = ? AND target = ?)`,
        [startLocation, endLocation, endLocation, startLocation]
      ),
    ]);

    const nodeMap = Object.fromEntries(rawNodes.map((n: any) => [n.id, n.name]));
    const fromName = nodeMap[startLocation] || startLocation;
    const toName = nodeMap[endLocation] || endLocation;

    if (rawEdges.length > 0) {
      // Direct route found
      const path: PathSegment[] = rawEdges.map((e: any) => ({
        from: fromName,
        to: toName,
        routeName: e.routeName,
        distance: e.distance,
        stopAndTransfer: e.stopAndTransfer || '',
        note: e.note || '',
        regularFare: e.regularFare !== null ? Number(e.regularFare) : calculateFare(e.distance),
        discountedFare: e.discountedFare !== null ? Number(e.discountedFare) : calculateDiscountedFare(e.distance),
        pathCoordinates: e.pathCoordinatesJson ? JSON.parse(e.pathCoordinatesJson) : null,
      }));

      const totalDistance = path.reduce((s, p) => s + p.distance, 0);
      const totalFare = path.reduce((s, p) => s + (p.regularFare ?? 0), 0);
      const discountedFare = path.reduce((s, p) => s + (p.discountedFare ?? 0), 0);

      return { message: 'Route found.', result: { path, totalDistance, totalFare, discountedFare } };
    }

    // 2. No direct edge — check for transfer routes
    const [transferRows] = await Promise.all([
      query<any[]>(
        `SELECT t.id, t.name FROM transfers t
         WHERE (t.from_node_id = ? AND t.to_node_id = ?)
            OR (t.from_node_id = ? AND t.to_node_id = ?)
         LIMIT 1`,
        [startLocation, endLocation, endLocation, startLocation]
      ),
    ]);

    if (transferRows.length === 0) {
      return { message: 'No route found between the selected locations.', error: true };
    }

    const transfer = transferRows[0];
    const rawLegs = await query<any[]>(
      `SELECT * FROM transfer_legs WHERE transfer_id = ? ORDER BY leg_order`,
      [transfer.id]
    );

    if (rawLegs.length === 0) {
      return { message: 'No route found between the selected locations.', error: true };
    }

    const path: PathSegment[] = rawLegs.map((leg: any, i: number) => ({
      from: i === 0 ? fromName : `Leg ${i}`,
      to: i === rawLegs.length - 1 ? toName : `Transfer ${i + 1}`,
      routeName: leg.route_name,
      distance: leg.distance,
      stopAndTransfer: leg.stop_and_transfer || '',
      note: leg.note || '',
      regularFare: leg.regular_fare !== null ? Number(leg.regular_fare) : calculateFare(leg.distance),
      discountedFare: leg.discounted_fare !== null ? Number(leg.discounted_fare) : calculateDiscountedFare(leg.distance),
      pathCoordinates: leg.path_coordinates ? JSON.parse(leg.path_coordinates) : null,
    }));

    const totalDistance = path.reduce((s, p) => s + p.distance, 0);
    const totalFare = path.reduce((s, p) => s + (p.regularFare ?? 0), 0);
    const discountedFare = path.reduce((s, p) => s + (p.discountedFare ?? 0), 0);

    return { message: 'Route found.', result: { path, totalDistance, totalFare, discountedFare } };
  } catch (error) {
    console.error('findRouteAction error:', error);
    return { message: 'An error occurred while searching for a route.', error: true };
  }
}
