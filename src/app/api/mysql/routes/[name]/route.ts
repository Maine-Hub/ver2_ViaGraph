import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql';

export async function PUT(request: Request, { params }: { params: { name: string } }) {
    const oldName = params.name;
    try {
        const { newName, description } = await request.json();
        if (!newName) throw new Error('New name is required');

        // Start a manual transaction sequence
        // MySQL doesn't have a simple transaction wrapper in this specific 'query' helper, 
        // but we can execute them sequentially. If one fails, it might leave partial state, 
        // but since we are using PRIMARY KEY updates, it's safer to do in order.

        // 1. Update the main route record
        await query(`UPDATE routes SET name = ?, description = ? WHERE name = ?`, [newName, description ?? '', oldName]);

        // 2. Cascading update for edges
        await query(`UPDATE edges SET route_name = ? WHERE route_name = ?`, [newName, oldName]);

        // 3. Cascading update for transfer legs
        await query(`UPDATE transfer_legs SET route_name = ? WHERE route_name = ?`, [newName, oldName]);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function DELETE(_: Request, { params }: { params: { name: string } }) {
    try {
        await query(`DELETE FROM routes WHERE name = ?`, [params.name]);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
