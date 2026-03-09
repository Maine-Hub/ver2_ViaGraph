import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql';

export async function POST(request: Request) {
    try {
        const { uid, email, username, role } = await request.json();
        await query(
            `INSERT INTO users (uid, email, username, role)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE email=VALUES(email), username=VALUES(username), role=VALUES(role)`,
            [uid, email, username ?? '', role ?? 'user']
        );
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
