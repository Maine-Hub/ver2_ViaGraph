import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql';

interface SyncPayload {
    nodes: { id: string; name: string; coordinates: { latitude: number; longitude: number } }[];
    routes: { name: string; description: string }[];
    edges: { source: string; target: string; distance: number; routeName: string; stopAndTransfer?: string }[];
}

export async function POST(request: Request) {
    try {
        const { nodes, routes, edges }: SyncPayload = await request.json();

        // Sync nodes
        for (const node of nodes) {
            await query(
                `INSERT INTO nodes (id, name, latitude, longitude)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name=VALUES(name), latitude=VALUES(latitude), longitude=VALUES(longitude)`,
                [node.id, node.name, node.coordinates?.latitude ?? 0, node.coordinates?.longitude ?? 0]
            );
        }

        // Sync routes (jeepney lines)
        for (const route of routes) {
            await query(
                `INSERT INTO routes (name, description)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE description=VALUES(description)`,
                [route.name, route.description ?? '']
            );
        }

        // Sync edges
        for (const edge of edges) {
            const edgeId = `${edge.source}_${edge.target}_${edge.routeName}`;
            await query(
                `INSERT INTO edges (id, source, target, distance, route_name, stop_and_transfer)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE distance=VALUES(distance), route_name=VALUES(route_name)`,
                [edgeId, edge.source, edge.target, edge.distance, edge.routeName, edge.stopAndTransfer ?? '']
            );
        }

        return NextResponse.json({
            success: true,
            message: `Synced ${nodes.length} nodes, ${routes.length} routes, ${edges.length} edges to MySQL.`,
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
