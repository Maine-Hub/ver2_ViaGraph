import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import { calculateFare, calculateDiscountedFare } from '@/lib/fare';
import { getSessionFromCookie } from '@/lib/auth';
import { recordActivity } from '@/lib/activity-logger';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const { source, target, distance, routeName, vehicleType, stopAndTransfer, note, pathCoordinates } = await request.json();

        const distNum = parseFloat(distance);
        const regularFare = calculateFare(distNum, vehicleType);
        const discountedFare = calculateDiscountedFare(distNum, vehicleType);

        const edgeId = `${source}_${target}_${routeName}`;
        const pathJson = pathCoordinates && pathCoordinates.length > 0
            ? JSON.stringify(pathCoordinates)
            : null;
        await query(
            `INSERT INTO edges (id, source, target, distance, route_name, vehicle_type, stop_and_transfer, note, path_coordinates, regular_fare, discounted_fare)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         distance=VALUES(distance),
         vehicle_type=VALUES(vehicle_type),
         stop_and_transfer=VALUES(stop_and_transfer),
         note=VALUES(note),
         path_coordinates=VALUES(path_coordinates),
         regular_fare=VALUES(regular_fare),
         discounted_fare=VALUES(discounted_fare)`,
            [edgeId, source, target, distance, routeName, vehicleType || 'jeepney', stopAndTransfer ?? '', note ?? '', pathJson, regularFare, discountedFare]
        );

        // Record activity
        const cookieStore = await cookies();
        const session = getSessionFromCookie(cookieStore.get('viagraph_session')?.value ?? null);
        await recordActivity({
            uid: session?.uid ?? 'system',
            username: session?.username ?? 'System',
            action: 'Updated Route',
            details: `Modified route ${routeName}: ${source} to ${target}`,
            category: 'admin'
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
