'use server';

import { z } from 'zod';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { fetchGraphData } from '@/lib/db';
import { getServerDb } from '@/firebase/server';
import { findShortestPath as dijkstra } from '@/lib/dijkstra';
import type { ShortestPathResult, PathSegment } from '@/lib/types';
import { revalidatePath } from 'next/cache';
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
  const validatedFields = FindRouteSchema.safeParse({
    startLocation: formData.get('startLocation'),
    endLocation: formData.get('endLocation'),
  });

  if (!validatedFields.success) {
    return {
      message: validatedFields.error.flatten().fieldErrors.startLocation?.[0] || validatedFields.error.flatten().fieldErrors.endLocation?.[0] || 'Invalid input.',
      error: true,
    };
  }

  const { startLocation, endLocation } = validatedFields.data;

  if (startLocation === endLocation) {
    return { message: 'Start and end locations cannot be the same.', error: true };
  }

  try {
    const db = getServerDb();
    const graph = await fetchGraphData(db);

    // Convert Location[] to Node format expected by dijkstra (if needed)
    // In our case, Location matches Node structure (id, name)
    const result = dijkstra(graph.nodes, graph.edges, startLocation, endLocation);

    if (!result || result.path.length === 0) {
      return { message: 'No route found between the selected locations.', error: true };
    }

    // Group consecutive path segments that use the same jeepney route
    const groupedPath: PathSegment[] = [];
    if (result.path.length > 0) {
      let currentSegment: PathSegment = { ...result.path[0] };

      for (let i = 1; i < result.path.length; i++) {
        const nextSegment = result.path[i];
        if (nextSegment.routeName === currentSegment.routeName && nextSegment.from === currentSegment.to) {
          // If the next segment continues on the same route, extend the current segment
          currentSegment.to = nextSegment.to;
          currentSegment.distance += nextSegment.distance;
        } else {
          // If the route changes, it's a transfer. Push the completed segment and start a new one.
          groupedPath.push(currentSegment);
          currentSegment = { ...nextSegment };
        }
      }
      groupedPath.push(currentSegment); // Push the last segment of the journey
    }

    // Add fare info to each segment
    const pathWithFares = groupedPath.map(segment => ({
      ...segment,
      regularFare: calculateFare(segment.distance),
      discountedFare: calculateDiscountedFare(segment.distance),
    }));

    // Calculate total fare by summing up the fares of each segment
    const totalFare = pathWithFares.reduce((total, segment) => total + (segment.regularFare || 0), 0);
    const discountedFare = pathWithFares.reduce((total, segment) => total + (segment.discountedFare || 0), 0);

    return {
      message: 'Shortest route found successfully.',
      result: {
        ...result,
        path: pathWithFares, // Use the new, grouped path with fares
        totalFare,
        discountedFare,
      },
    };
  } catch (error) {
    return { message: 'An error occurred while calculating the route.', error: true };
  }
}

// Admin Actions
export async function addLocationAction(formData: FormData) {
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const latitude = parseFloat(formData.get('latitude') as string);
  const longitude = parseFloat(formData.get('longitude') as string);

  try {
    const db = getServerDb();
    await setDoc(doc(db, 'nodes', id), {
      id,
      name,
      coordinates: {
        latitude: isNaN(latitude) ? 0 : latitude,
        longitude: isNaN(longitude) ? 0 : longitude
      }
    });
    revalidatePath('/admin');
    return { message: 'Location added successfully.' };
  } catch (error) {
    return { message: 'Failed to add location.', error: true };
  }
}

export async function addRouteAction(formData: FormData) {
  const source = formData.get('source') as string;
  const target = formData.get('target') as string;
  const distance = parseFloat(formData.get('distance') as string);
  const routeName = formData.get('routeName') as string;
  const stopAndTransfer = formData.get('stopAndTransfer') as string;
  const fareDetails = formData.get('fareDetails') as string;

  try {
    const db = getServerDb();
    const edgeId = `${source}_${target}_${routeName}`;
    await setDoc(doc(db, 'edges', edgeId), {
      source,
      target,
      distance,
      routeName,
      stopAndTransfer: stopAndTransfer || '',
      fareDetails: fareDetails || ''
    });
    revalidatePath('/admin');
    return { message: 'Route added successfully.' };
  } catch (error) {
    return { message: 'Failed to add route.', error: true };
  }
}

export async function addJeepneyLineAction(formData: FormData) {
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;

  try {
    const db = getServerDb();
    await setDoc(doc(db, 'routes', name), { name, description });
    revalidatePath('/admin');
    return { message: 'Jeepney line added successfully.' };
  } catch (error) {
    return { message: 'Failed to add jeepney line.', error: true };
  }
}

export async function deleteItemAction(type: 'location' | 'route' | 'jeepney-line', id: string) {
  try {
    const db = getServerDb();
    let collectionName = '';
    switch (type) {
      case 'location': collectionName = 'nodes'; break;
      case 'route': collectionName = 'edges'; break;
      case 'jeepney-line': collectionName = 'routes'; break;
    }
    await deleteDoc(doc(db, collectionName, id));
    revalidatePath('/admin');
    return { message: `${type} deleted successfully.` };
  } catch (error) {
    return { message: `Failed to delete ${type}.`, error: true };
  }
}
