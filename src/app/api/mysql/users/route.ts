import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql';

export async function GET() {
    try {
        const users = await query<any[]>('SELECT uid, email, username, role FROM users ORDER BY username ASC');
        return NextResponse.json({ success: true, users });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

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

export async function PATCH(request: Request) {
    try {
        const { uid, role } = await request.json();
        if (!uid || !['user', 'admin'].includes(role)) {
            return NextResponse.json({ success: false, message: 'Invalid uid or role.' }, { status: 400 });
        }
        await query('UPDATE users SET role = ? WHERE uid = ?', [role, uid]);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
