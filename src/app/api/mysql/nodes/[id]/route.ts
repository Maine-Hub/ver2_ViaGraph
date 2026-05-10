import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql';

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
    try {
        await query(`DELETE FROM nodes WHERE id = ?`, [params.id]);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
