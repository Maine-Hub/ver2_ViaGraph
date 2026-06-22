import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql';

export async function GET() {
  try {
    const blocks = await query<any[]>('SELECT * FROM route_blocks WHERE is_archived = 0 AND is_history = 0 ORDER BY created_at DESC');
    return NextResponse.json({ success: true, data: blocks });
  } catch (error: any) {
    console.error('Failed to fetch route blocks:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sourceId, targetId, routeName, vehicleType, distance, pathCoordinates, note } = body;

    if (!sourceId || !targetId || !routeName || distance === undefined) {
      return NextResponse.json({ success: false, message: 'Missing required fields.' }, { status: 400 });
    }

    // 1. Calculate fare dynamically before insertion
    const rules = await query<any[]>('SELECT * FROM fare_matrix WHERE vehicle_type = ?', [vehicleType || 'jeepney']);
    const rule = rules.length > 0 ? rules[0] : null;

    let regularFare = 0;
    let discountedFare = 0;

    if (rule && distance > 0 && vehicleType !== 'walking') {
      const baseFare = Number(rule.base_fare);
      regularFare = Math.round(baseFare);
      
      const rawDiscounted = baseFare * (1 - Number(rule.discount_rate));
      discountedFare = Math.ceil(rawDiscounted);
    }

    // 2. Insert into database
    const pathJson = pathCoordinates ? JSON.stringify(pathCoordinates) : null;
    
    await query(
      `INSERT INTO route_blocks 
       (source_id, target_id, route_name, vehicle_type, distance, regular_fare, discounted_fare, path_coordinates, note) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [sourceId, targetId, routeName, vehicleType || 'jeepney', distance, regularFare, discountedFare, pathJson, note || null]
    );

    // 3. Auto-insert route name into routes table if it doesn't exist
    const existingRoute = await query<any[]>('SELECT name FROM routes WHERE name = ?', [routeName]);
    if (existingRoute.length === 0) {
        await query('INSERT INTO routes (name, description, color) VALUES (?, ?, ?)', [routeName, routeName, '#6366f1']);
    }

    return NextResponse.json({ success: true, message: 'Route block added successfully.' });
  } catch (error: any) {
    console.error('Failed to add route block:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
