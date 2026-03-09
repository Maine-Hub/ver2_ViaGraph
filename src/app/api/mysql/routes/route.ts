import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql';

export async function POST(request: Request) {
    try {
        const { name, description } = await request.json();
        await query(
            `INSERT INTO routes (name, description)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE description=VALUES(description)`,
            [name, description ?? '']
        );
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
