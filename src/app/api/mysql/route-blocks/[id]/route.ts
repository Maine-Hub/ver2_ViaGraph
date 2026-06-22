import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, message: 'Route Block ID is required.' }, { status: 400 });
    }

    await query('UPDATE route_blocks SET is_archived = 1 WHERE id = ?', [id]);
    return NextResponse.json({ success: true, message: 'Route block archived successfully.' });
  } catch (error: any) {
    console.error('Failed to archive route block:', error);
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

    // Fetch the current active block to capture it for version history
    const currentBlocks = await query<any[]>('SELECT * FROM route_blocks WHERE id = ?', [id]);
    if (currentBlocks.length === 0) {
      return NextResponse.json({ success: false, message: 'Route block not found.' }, { status: 404 });
    }
    const currentBlock = currentBlocks[0];

    // 1. Calculate fare dynamically before update
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

    // 2. Duplicate current active block as a historical version
    await query(
      `INSERT INTO route_blocks (
        source_id, target_id, route_name, vehicle_type, distance,
        regular_fare, discounted_fare, path_coordinates, note,
        original_excel_ref, block_order, version, parent_id, is_history, is_archived, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?)`,
      [
        currentBlock.source_id,
        currentBlock.target_id,
        currentBlock.route_name,
        currentBlock.vehicle_type,
        currentBlock.distance,
        currentBlock.regular_fare,
        currentBlock.discounted_fare,
        currentBlock.path_coordinates,
        currentBlock.note,
        currentBlock.original_excel_ref,
        currentBlock.block_order,
        currentBlock.version || 1,
        id,
        currentBlock.created_at
      ]
    );

    // 3. Update active database record with the new inputs and incremented version
    const pathJson = pathCoordinates ? JSON.stringify(pathCoordinates) : null;
    const nextVersion = (currentBlock.version || 1) + 1;
    
    await query(
      `UPDATE route_blocks 
       SET source_id = ?, target_id = ?, route_name = ?, vehicle_type = ?, distance = ?, 
           regular_fare = ?, discounted_fare = ?, path_coordinates = ?, note = ?, 
           version = ?, parent_id = NULL, is_history = 0
       WHERE id = ?`,
      [sourceId, targetId, routeName, vehicleType || 'jeepney', distance, regularFare, discountedFare, pathJson, note || null, nextVersion, id]
    );

    // 4. Auto-insert route name into routes table if it doesn't exist
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
