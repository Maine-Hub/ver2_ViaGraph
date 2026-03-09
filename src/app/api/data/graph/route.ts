import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql';

export async function GET() {
    try {
        const [nodes, routes, edges] = await Promise.all([
            query<any[]>('SELECT id, name, latitude as lat, longitude as lng FROM nodes'),
            query<any[]>('SELECT name, description FROM routes'),
            query<any[]>('SELECT id, source, target, distance, route_name as routeName, stop_and_transfer as stopAndTransfer, fare_details as fareDetails, note, path_coordinates as pathCoordinatesJson FROM edges'),
        ]);

        // Reshape nodes to match Location type
        const locationNodes = nodes.map((n: any) => ({
            id: n.id,
            name: n.name,
            coordinates: { latitude: n.lat, longitude: n.lng },
        }));

        // Parse stored path_coordinates JSON for each edge
        const reshapedEdges = edges.map((e: any) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            distance: e.distance,
            routeName: e.routeName,
            stopAndTransfer: e.stopAndTransfer,
            fareDetails: e.fareDetails,
            note: e.note,
            pathCoordinates: e.pathCoordinatesJson ? JSON.parse(e.pathCoordinatesJson) : null,
        }));

        return NextResponse.json({ nodes: locationNodes, routes, edges: reshapedEdges });
    } catch (error: any) {
        console.error('Graph data fetch error:', error);
        return NextResponse.json({ nodes: [], routes: [], edges: [] }, { status: 500 });
    }
}
