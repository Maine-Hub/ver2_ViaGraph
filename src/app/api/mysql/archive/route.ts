import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql';

// GET all archived items
export async function GET() {
  try {
    const [archivedBlocks, archivedNodes, archivedRoutes] = await Promise.all([
      query<any[]>(`
        SELECT rb.id, rb.route_name, rb.vehicle_type, rb.distance,
               n1.name as source_name, n2.name as target_name
        FROM route_blocks rb
        JOIN nodes n1 ON rb.source_id = n1.id
        JOIN nodes n2 ON rb.target_id = n2.id
        WHERE rb.is_archived = 1
      `),
      query<any[]>('SELECT id, name, latitude, longitude FROM nodes WHERE is_archived = 1'),
      query<any[]>('SELECT name, description, color FROM routes WHERE is_archived = 1')
    ]);

    return NextResponse.json({
      success: true,
      data: {
        routeBlocks: archivedBlocks,
        nodes: archivedNodes,
        routes: archivedRoutes
      }
    });
  } catch (error: any) {
    console.error('Failed to fetch archived items:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST to restore an archived item
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, id } = body;

    if (!type || !id) {
      return NextResponse.json({ success: false, message: 'Type and ID are required.' }, { status: 400 });
    }

    if (type === 'node') {
      await query('UPDATE nodes SET is_archived = 0 WHERE id = ?', [id]);
      return NextResponse.json({ success: true, message: 'Location restored successfully.' });
    }

    if (type === 'route') {
      await query('UPDATE routes SET is_archived = 0 WHERE name = ?', [id]);
      return NextResponse.json({ success: true, message: 'Jeepney line restored successfully.' });
    }

    if (type === 'route-block') {
      // 1. Get the route block details
      const blocks = await query<any[]>('SELECT source_id, target_id, route_name FROM route_blocks WHERE id = ?', [id]);
      if (blocks.length === 0) {
        return NextResponse.json({ success: false, message: 'Route block not found.' }, { status: 404 });
      }

      const { source_id, target_id, route_name } = blocks[0];

      // 2. Check if source or target node is archived
      const nodesCheck = await query<any[]>(
        'SELECT id, name, is_archived FROM nodes WHERE id IN (?, ?)',
        [source_id, target_id]
      );
      
      const archivedNode = nodesCheck.find(n => n.is_archived === 1);
      if (archivedNode) {
        return NextResponse.json({
          success: false,
          message: `Cannot restore: the location "${archivedNode.name}" is archived. Please restore it first.`
        }, { status: 400 });
      }

      // 3. Auto-restore the route definition color record if it was archived
      await query('UPDATE routes SET is_archived = 0 WHERE name = ?', [route_name]);

      // 4. Restore the route block
      await query('UPDATE route_blocks SET is_archived = 0 WHERE id = ?', [id]);

      return NextResponse.json({ success: true, message: 'Route block and associated route line restored successfully.' });
    }

    return NextResponse.json({ success: false, message: 'Invalid type specified.' }, { status: 400 });
  } catch (error: any) {
    console.error('Failed to restore item:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
