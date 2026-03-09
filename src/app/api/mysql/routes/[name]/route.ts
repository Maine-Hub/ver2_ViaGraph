import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql';

export async function DELETE(_: Request, { params }: { params: { name: string } }) {
    try {
        await query(`DELETE FROM routes WHERE name = ?`, [params.name]);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
