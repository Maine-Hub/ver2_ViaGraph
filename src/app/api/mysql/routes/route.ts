import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql';

export async function POST(request: Request) {
    try {
        const { name, description, color } = await request.json();
        await query(
            `INSERT INTO routes (name, description, color)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE description=VALUES(description), color=VALUES(color)`,
            [name, description ?? '', color ?? '#6366f1']
        );
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
