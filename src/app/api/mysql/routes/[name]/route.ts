import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql';

export async function PUT(request: Request, { params }: { params: Promise<{ name: string }> }) {
    try {
        const { name: oldName } = await params;
        const { newName, description, color } = await request.json();
        if (!newName) throw new Error('New name is required');

        const isRename = newName.toLowerCase() !== oldName.toLowerCase();
        let isMerge = false;

        if (isRename) {
            const existing = await query<any[]>(`SELECT name FROM routes WHERE name = ?`, [newName]);
            if (existing.length > 0) {
                isMerge = true;
            }
        }

        if (isMerge) {
            // Update description and color of the existing target route
            await query(`UPDATE routes SET description = ?, color = ? WHERE name = ?`, [description ?? '', color ?? '#6366f1', newName]);

            // Update all route blocks of the old route to point to the new route
            await query(`UPDATE route_blocks SET route_name = ? WHERE route_name = ?`, [newName, oldName]);

            // Delete the old route record
            await query(`DELETE FROM routes WHERE name = ?`, [oldName]);

            return NextResponse.json({ success: true, message: `Jeepney lines merged into "${newName}" successfully.` });
        }

        if (isRename) {
            // Update name, description, color
            await query(`UPDATE routes SET name = ?, description = ?, color = ? WHERE name = ?`, [newName, description ?? '', color ?? '#6366f1', oldName]);
            // Cascade to route_blocks
            await query(`UPDATE route_blocks SET route_name = ? WHERE route_name = ?`, [newName, oldName]);
        } else {
            // Just update description and color
            await query(`UPDATE routes SET description = ?, color = ? WHERE name = ?`, [description ?? '', color ?? '#6366f1', oldName]);
        }

        return NextResponse.json({ success: true, message: `Jeepney line updated successfully.` });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ name: string }> }) {
    try {
        const { name } = await params;
        // Archive any route blocks associated with this route name
        await query(`UPDATE route_blocks SET is_archived = 1 WHERE route_name = ?`, [name]);
        await query(`UPDATE routes SET is_archived = 1 WHERE name = ?`, [name]);
        return NextResponse.json({ success: true, message: 'Jeepney line archived successfully.' });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
