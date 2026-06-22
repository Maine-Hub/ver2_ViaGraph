import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql';

// GET all fare rules
export async function GET() {
  try {
    const rules = await query<any[]>('SELECT * FROM fare_matrix ORDER BY id ASC');
    return NextResponse.json({ success: true, data: rules });
  } catch (error: any) {
    console.error('Failed to fetch fare matrix:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST to update a specific fare rule
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { vehicleType, baseFare, baseKm, succeedingKmRate, discountRate } = body;

    if (!vehicleType) {
      return NextResponse.json({ success: false, message: 'Vehicle type is required.' }, { status: 400 });
    }

    // Upsert logic (Update if exists, else Insert)
    const existing = await query<any[]>('SELECT id FROM fare_matrix WHERE vehicle_type = ?', [vehicleType]);
    
    if (existing.length > 0) {
      await query(
        'UPDATE fare_matrix SET base_fare = ?, base_km = ?, succeeding_km_rate = ?, discount_rate = ? WHERE vehicle_type = ?',
        [baseFare, baseKm, succeedingKmRate, discountRate, vehicleType]
      );
    } else {
      await query(
        'INSERT INTO fare_matrix (vehicle_type, base_fare, base_km, succeeding_km_rate, discount_rate) VALUES (?, ?, ?, ?, ?)',
        [vehicleType, baseFare, baseKm, succeedingKmRate, discountRate]
      );
    }

    // Trigger mass update of route_blocks cached fares based on the new rules
    const rules = await query<any[]>('SELECT * FROM fare_matrix');
    const fareRulesMap: Record<string, any> = {};
    rules.forEach(r => {
        fareRulesMap[r.vehicle_type] = r;
    });

    const blocks = await query<any[]>('SELECT id, distance, vehicle_type FROM route_blocks');
    
    for (const block of blocks) {
        const rule = fareRulesMap[block.vehicle_type] || fareRulesMap['jeepney'];
        if (rule) {
            const regularFare = Math.round(Number(rule.base_fare));
            const rawDiscounted = Number(rule.base_fare) * (1 - Number(rule.discount_rate));
            const discountedFare = Math.ceil(rawDiscounted);

            await query(
                'UPDATE route_blocks SET regular_fare = ?, discounted_fare = ? WHERE id = ?',
                [regularFare, discountedFare, block.id]
            );
        }
    }

    return NextResponse.json({ success: true, message: 'Fare rule updated and cached route fares recalculated.' });
  } catch (error: any) {
    console.error('Failed to update fare rule:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
