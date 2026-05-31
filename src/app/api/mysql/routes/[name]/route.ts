import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql';

export async function PUT(request: Request, { params }: { params: Promise<{ name: string }> }) {
    try {
        const { name: oldName } = await params;
        const { newName, description, color } = await request.json();
        if (!newName) throw new Error('New name is required');

        // 1. Update the main route record (including color)
        await query(`UPDATE routes SET name = ?, description = ?, color = ? WHERE name = ?`, [newName, description ?? '', color ?? '#6366f1', oldName]);

        // 2. Cascading update for edges
        await query(`UPDATE edges SET route_name = ? WHERE route_name = ?`, [newName, oldName]);

        // 3. Cascading update for transfer legs
        await query(`UPDATE transfer_legs SET route_name = ? WHERE route_name = ?`, [newName, oldName]);

        return NextResponse.json({ success: true });
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
