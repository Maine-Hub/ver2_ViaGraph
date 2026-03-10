import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import { calculateFare, calculateDiscountedFare } from '@/lib/fare';

// GET — list all transfer routes with their legs
export async function GET() {
    try {
        const transfers = await query<any[]>(
            `SELECT t.id, t.name, t.from_node_id, t.to_node_id,
                    fn.name AS from_name, tn.name AS to_name
             FROM transfers t
             LEFT JOIN nodes fn ON fn.id = t.from_node_id
             LEFT JOIN nodes tn ON tn.id = t.to_node_id
             ORDER BY t.created_at DESC`
        );
        const legs = await query<any[]>(
            `SELECT * FROM transfer_legs ORDER BY transfer_id, leg_order`
        );

        const result = transfers.map((t: any) => ({
            ...t,
            legs: legs
                .filter((l: any) => l.transfer_id === t.id)
                .map((l: any) => ({
                    ...l,
                    pathCoordinates: l.path_coordinates ? JSON.parse(l.path_coordinates) : null,
                })),
        }));

        return NextResponse.json({ success: true, transfers: result });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

// POST — create a transfer route with legs
export async function POST(request: Request) {
    try {
        const { id, fromNodeId, toNodeId, name, legs } = await request.json();
        if (!fromNodeId || !toNodeId || !legs?.length) {
            return NextResponse.json({ success: false, message: 'fromNodeId, toNodeId and at least one leg are required.' }, { status: 400 });
        }

        const transferId = id || `${fromNodeId}_${toNodeId}_${Date.now()}`;

        await query(
            `INSERT INTO transfers (id, from_node_id, to_node_id, name) VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE name=VALUES(name)`,
            [transferId, fromNodeId, toNodeId, name || '']
        );

        // Delete existing legs for safety, then re-insert
        await query(`DELETE FROM transfer_legs WHERE transfer_id = ?`, [transferId]);

        for (let i = 0; i < legs.length; i++) {
            const leg = legs[i];
            const legId = `${transferId}_leg_${i}`;
            const pathJson = leg.pathCoordinates?.length > 1 ? JSON.stringify(leg.pathCoordinates) : null;

            const distNum = parseFloat(leg.distance);
            const regularFare = calculateFare(distNum);
            const discountedFare = calculateDiscountedFare(distNum);

            await query(
                `INSERT INTO transfer_legs (id, transfer_id, leg_order, route_name, distance, stop_and_transfer, note, path_coordinates, regular_fare, discounted_fare)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [legId, transferId, i, leg.routeName, leg.distance, leg.stopAndTransfer || '', leg.note || '', pathJson, regularFare, discountedFare]
            );
        }

        return NextResponse.json({ success: true, id: transferId });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
