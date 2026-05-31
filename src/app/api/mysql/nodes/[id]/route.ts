import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql';

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        // Check if any active (unarchived) route blocks reference this node
        const refs = await query<any[]>(
            `SELECT COUNT(*) as count FROM route_blocks WHERE (source_id = ? OR target_id = ?) AND is_archived = 0`,
            [id, id]
        );
        if (refs[0].count > 0) {
            return NextResponse.json({
                success: false,
                message: `Cannot archive: this location is used by ${refs[0].count} active route block(s). Archive those route blocks first.`
            }, { status: 400 });
        }
        await query(`UPDATE nodes SET is_archived = 1 WHERE id = ?`, [id]);
        return NextResponse.json({ success: true, message: 'Location archived successfully.' });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
