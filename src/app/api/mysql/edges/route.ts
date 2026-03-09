import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql';

export async function POST(request: Request) {
    try {
        const { source, target, distance, routeName, stopAndTransfer, fareDetails, note, pathCoordinates } = await request.json();
        const edgeId = `${source}_${target}_${routeName}`;
        const pathJson = pathCoordinates && pathCoordinates.length > 0
            ? JSON.stringify(pathCoordinates)
            : null;
        await query(
            `INSERT INTO edges (id, source, target, distance, route_name, stop_and_transfer, fare_details, note, path_coordinates)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         distance=VALUES(distance),
         stop_and_transfer=VALUES(stop_and_transfer),
         fare_details=VALUES(fare_details),
         note=VALUES(note),
         path_coordinates=VALUES(path_coordinates)`,
            [edgeId, source, target, distance, routeName, stopAndTransfer ?? '', fareDetails ?? '', note ?? '', pathJson]
        );
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
