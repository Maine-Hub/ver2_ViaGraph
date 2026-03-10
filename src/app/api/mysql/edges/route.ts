import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import { calculateFare, calculateDiscountedFare } from '@/lib/fare';

export async function POST(request: Request) {
    try {
        const { source, target, distance, routeName, stopAndTransfer, note, pathCoordinates } = await request.json();

        const distNum = parseFloat(distance);
        const regularFare = calculateFare(distNum);
        const discountedFare = calculateDiscountedFare(distNum);

        const edgeId = `${source}_${target}_${routeName}`;
        const pathJson = pathCoordinates && pathCoordinates.length > 0
            ? JSON.stringify(pathCoordinates)
            : null;
        await query(
            `INSERT INTO edges (id, source, target, distance, route_name, stop_and_transfer, note, path_coordinates, regular_fare, discounted_fare)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         distance=VALUES(distance),
         stop_and_transfer=VALUES(stop_and_transfer),
         note=VALUES(note),
         path_coordinates=VALUES(path_coordinates),
         regular_fare=VALUES(regular_fare),
         discounted_fare=VALUES(discounted_fare)`,
            [edgeId, source, target, distance, routeName, stopAndTransfer ?? '', note ?? '', pathJson, regularFare, discountedFare]
        );
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
