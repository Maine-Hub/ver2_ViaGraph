import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import { recordActivity } from '@/lib/activity-logger';

export async function GET() {
    try {
        const rules = await query('SELECT * FROM fare_rules');
        return NextResponse.json({ success: true, data: rules });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const vehicleType = body.vehicleType || body.vehicle_type;
        const baseFare = body.baseFare !== undefined ? body.baseFare : body.base_fare;
        const firstKm = body.firstKm !== undefined ? body.firstKm : body.first_km;
        const succeedingKmFare = body.succeedingKmFare !== undefined ? body.succeedingKmFare : body.succeeding_km_fare;
        const discountPercentage = body.discountPercentage !== undefined ? body.discountPercentage : body.discount_percentage;

        if (!vehicleType || baseFare === undefined || firstKm === undefined || succeedingKmFare === undefined || discountPercentage === undefined) {
            return NextResponse.json({ success: false, message: 'Missing required fields', received: body }, { status: 400 });
        }

        await query(
            `INSERT INTO fare_rules (vehicle_type, base_fare, first_km, succeeding_km_fare, discount_percentage)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
             base_fare = VALUES(base_fare),
             first_km = VALUES(first_km),
             succeeding_km_fare = VALUES(succeeding_km_fare),
             discount_percentage = VALUES(discount_percentage)`,
            [vehicleType, baseFare, firstKm, succeedingKmFare, discountPercentage]
        );

        // Record activity
        await recordActivity({
            uid: 'admin', // Placeholder, ideally from session
            username: 'Admin',
            action: 'Updated Fare Rules',
            details: `Updated rules for ${vehicleType}: Base=${baseFare}, 1stKm=${firstKm}, Addon=${succeedingKmFare}, Disc=${discountPercentage}`,
            category: 'admin'
        });

        return NextResponse.json({ success: true, message: `Fare rules for ${vehicleType} updated.` });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
