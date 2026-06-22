import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, message: 'ID is required.' }, { status: 400 });
    }

    const [activeBlocks, historyBlocks] = await Promise.all([
      query<any[]>('SELECT * FROM route_blocks WHERE id = ?', [id]),
      query<any[]>('SELECT * FROM route_blocks WHERE parent_id = ? AND is_history = 1 ORDER BY version DESC', [id])
    ]);

    if (activeBlocks.length === 0) {
      return NextResponse.json({ success: false, message: 'Route block not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        active: activeBlocks[0],
        history: historyBlocks
      }
    });
  } catch (error: any) {
    console.error('Failed to fetch route block versions:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params; // Active block ID
    const body = await req.json();
    const { historyId } = body; // The history block row ID to restore

    if (!id || !historyId) {
      return NextResponse.json({ success: false, message: 'Active ID and History ID are required.' }, { status: 400 });
    }

    // 1. Fetch the history block we want to restore
    const historyBlocks = await query<any[]>('SELECT * FROM route_blocks WHERE id = ? AND is_history = 1', [historyId]);
    if (historyBlocks.length === 0) {
      return NextResponse.json({ success: false, message: 'History version not found.' }, { status: 404 });
    }
    const targetHistory = historyBlocks[0];

    // 2. Fetch the current active block
    const activeBlocks = await query<any[]>('SELECT * FROM route_blocks WHERE id = ?', [id]);
    if (activeBlocks.length === 0) {
      return NextResponse.json({ success: false, message: 'Active route block not found.' }, { status: 404 });
    }
    const currentActive = activeBlocks[0];

    // 3. Save the current active state as a history row (so we preserve it!)
    await query(
      `INSERT INTO route_blocks (
        source_id, target_id, route_name, vehicle_type, distance,
        regular_fare, discounted_fare, path_coordinates, note,
        original_excel_ref, block_order, version, parent_id, is_history, is_archived, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?)`,
      [
        currentActive.source_id,
        currentActive.target_id,
        currentActive.route_name,
        currentActive.vehicle_type,
        currentActive.distance,
        currentActive.regular_fare,
        currentActive.discounted_fare,
        currentActive.path_coordinates,
        currentActive.note,
        currentActive.original_excel_ref,
        currentActive.block_order,
        currentActive.version || 1,
        id,
        currentActive.created_at
      ]
    );

    // 4. Update the active block with the values from the target history block, incrementing its version
    const nextVersion = (currentActive.version || 1) + 1;
    await query(
      `UPDATE route_blocks 
       SET source_id = ?, target_id = ?, route_name = ?, vehicle_type = ?, distance = ?,
           regular_fare = ?, discounted_fare = ?, path_coordinates = ?, note = ?, 
           version = ?, parent_id = NULL, is_history = 0
       WHERE id = ?`,
      [
        targetHistory.source_id,
        targetHistory.target_id,
        targetHistory.route_name,
        targetHistory.vehicle_type,
        targetHistory.distance,
        targetHistory.regular_fare,
        targetHistory.discounted_fare,
        targetHistory.path_coordinates,
        targetHistory.note,
        nextVersion,
        id
      ]
    );

    return NextResponse.json({ success: true, message: `Version ${targetHistory.version} restored successfully.` });
  } catch (error: any) {
    console.error('Failed to restore route block version:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
