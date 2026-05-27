import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql';

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        // Check if any route blocks reference this node
        const refs = await query<any[]>(
            `SELECT COUNT(*) as count FROM route_blocks WHERE source_id = ? OR target_id = ?`,
            [id, id]
        );
        if (refs[0].count > 0) {
            return NextResponse.json({
                success: false,
                message: `Cannot delete: this location is used by ${refs[0].count} route block(s). Delete those route blocks first.`
            }, { status: 400 });
        }
        await query(`DELETE FROM nodes WHERE id = ?`, [id]);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
