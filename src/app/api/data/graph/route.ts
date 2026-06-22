import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql';

export async function GET() {
    try {
        const [nodes, routeBlocks] = await Promise.all([
            query<any[]>('SELECT id, name, latitude as lat, longitude as lng FROM nodes WHERE is_archived = 0'),
            query<any[]>('SELECT id, source_id as source, target_id as target, distance, route_name as routeName, vehicle_type, regular_fare as regularFare, discounted_fare as discountedFare, path_coordinates as pathCoordinatesJson, note FROM route_blocks WHERE is_archived = 0 AND is_history = 0'),
        ]);

        // Reshape nodes to match Location type
        const locationNodes = nodes.map((n: any) => ({
            id: n.id,
            name: n.name,
            coordinates: { latitude: n.lat, longitude: n.lng },
        }));

        // Sort nodes alphabetically by name
        locationNodes.sort((a: any, b: any) => a.name.localeCompare(b.name));

        // Parse stored path_coordinates JSON for each block
        const reshapedEdges = routeBlocks.map((e: any) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            distance: e.distance,
            routeName: e.routeName,
            stopAndTransfer: e.vehicle_type, // Using vehicle_type temporarily for display
            note: e.note || '',
            regularFare: e.regularFare,
            discountedFare: e.discountedFare,
            pathCoordinates: e.pathCoordinatesJson 
                ? JSON.parse(e.pathCoordinatesJson) 
                : null,
        }));

        // Load routes from routes table to get actual descriptions and colors
        const dbRoutes = await query<any[]>('SELECT name, description, color FROM routes WHERE is_archived = 0');
        const dbRoutesMap: Record<string, { description: string, color: string }> = {};
        dbRoutes.forEach(r => {
            dbRoutesMap[r.name] = { description: r.description, color: r.color };
        });

        // Generate distinct routes for legend
        const uniqueRouteNames = Array.from(new Set(routeBlocks.map((e: any) => e.routeName)));
        uniqueRouteNames.sort((a: any, b: any) => a.localeCompare(b));

        const routes = uniqueRouteNames.map(name => ({
            name: name,
            description: dbRoutesMap[name]?.description || name,
            color: dbRoutesMap[name]?.color || '#6366f1'
        }));

        return NextResponse.json({ nodes: locationNodes, routes, edges: reshapedEdges });
    } catch (error: any) {
        console.error('Graph data fetch error:', error);
        return NextResponse.json({ nodes: [], routes: [], edges: [] }, { status: 500 });
    }
}
