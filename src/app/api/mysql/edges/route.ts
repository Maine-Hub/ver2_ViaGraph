import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import { calculateFare, calculateDiscountedFare } from '@/lib/fare';
import { getSessionFromCookie } from '@/lib/auth';
import { recordActivity } from '@/lib/activity-logger';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const { source, target, distance, routeName, vehicleType, stopAndTransfer, note, pathCoordinates, isActive, regularFare, discountedFare } = await request.json();

        const distNum = parseFloat(distance);
        const finalRegularFare = regularFare !== undefined && regularFare !== '' ? parseFloat(regularFare) : calculateFare(distNum, vehicleType);
        const finalDiscountedFare = discountedFare !== undefined && discountedFare !== '' ? parseFloat(discountedFare) : calculateDiscountedFare(distNum, vehicleType);
        const finalIsActive = isActive !== undefined ? (isActive ? 1 : 0) : 1;

        const edgeId = `${source}_${target}_${routeName}`;
        const pathJson = pathCoordinates && pathCoordinates.length > 0
            ? JSON.stringify(pathCoordinates)
            : null;
        await query(
            `INSERT INTO edges (id, source, target, distance, route_name, vehicle_type, stop_and_transfer, note, path_coordinates, regular_fare, discounted_fare, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         distance=VALUES(distance),
         vehicle_type=VALUES(vehicle_type),
         stop_and_transfer=VALUES(stop_and_transfer),
         note=VALUES(note),
         path_coordinates=VALUES(path_coordinates),
         regular_fare=VALUES(regular_fare),
         discounted_fare=VALUES(discounted_fare),
         is_active=VALUES(is_active)`,
            [edgeId, source, target, distance, routeName, vehicleType || 'jeepney', stopAndTransfer ?? '', note ?? '', pathJson, finalRegularFare, finalDiscountedFare, finalIsActive]
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
