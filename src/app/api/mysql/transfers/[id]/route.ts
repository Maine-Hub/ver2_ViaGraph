import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql';

export async function DELETE(
    _request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        await query(`DELETE FROM transfer_legs WHERE transfer_id = ?`, [id]);
        await query(`DELETE FROM transfers WHERE id = ?`, [id]);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
