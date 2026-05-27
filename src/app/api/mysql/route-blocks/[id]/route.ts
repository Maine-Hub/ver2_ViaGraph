import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, message: 'Route Block ID is required.' }, { status: 400 });
    }

    await query('DELETE FROM route_blocks WHERE id = ?', [id]);
    return NextResponse.json({ success: true, message: 'Route block deleted successfully.' });
  } catch (error: any) {
    console.error('Failed to delete route block:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, message: 'Route Block ID is required.' }, { status: 400 });
    }

    const body = await req.json();
    const { sourceId, targetId, routeName, vehicleType, distance, pathCoordinates, note } = body;

    if (!sourceId || !targetId || !routeName || distance === undefined) {
      return NextResponse.json({ success: false, message: 'Missing required fields.' }, { status: 400 });
    }

    // 1. Calculate fare dynamically before update
    const rules = await query<any[]>('SELECT * FROM fare_matrix WHERE vehicle_type = ?', [vehicleType || 'jeepney']);
    const rule = rules.length > 0 ? rules[0] : null;

    let regularFare = 0;
    let discountedFare = 0;

    if (rule && distance > 0 && vehicleType !== 'walking') {
      let rawRegular = Number(rule.base_fare);
      if (distance > Number(rule.base_km)) {
          rawRegular += (distance - Number(rule.base_km)) * Number(rule.succeeding_km_rate);
      }
      regularFare = Math.round(rawRegular / 0.25) * 0.25;
      
      const rawDiscounted = rawRegular * (1 - Number(rule.discount_rate));
      discountedFare = Math.round(rawDiscounted / 0.25) * 0.25;
    }

    // 2. Update database
    const pathJson = pathCoordinates ? JSON.stringify(pathCoordinates) : null;
    
    await query(
      `UPDATE route_blocks 
       SET source_id = ?, target_id = ?, route_name = ?, vehicle_type = ?, distance = ?, regular_fare = ?, discounted_fare = ?, path_coordinates = ?, note = ?
       WHERE id = ?`,
      [sourceId, targetId, routeName, vehicleType || 'jeepney', distance, regularFare, discountedFare, pathJson, note || null, id]
    );

    // 3. Auto-insert route name into routes table if it doesn't exist
    const existingRoute = await query<any[]>('SELECT name FROM routes WHERE name = ?', [routeName]);
    if (existingRoute.length === 0) {
        await query('INSERT INTO routes (name, description, color) VALUES (?, ?, ?)', [routeName, routeName, '#6366f1']);
    }

    return NextResponse.json({ success: true, message: 'Route block updated successfully.' });
  } catch (error: any) {
    console.error('Failed to update route block:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
