import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import { hashPassword, makeSessionCookie, SessionUser } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const { username, email, password } = await request.json();

        if (!email || !password || !username) {
            return NextResponse.json({ success: false, message: 'All fields are required.' }, { status: 400 });
        }

        // Check if email already exists
        const existing = await query<any[]>('SELECT uid FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return NextResponse.json({ success: false, message: 'Email already registered.' }, { status: 409 });
        }

        const uid = crypto.randomUUID();
        const hashedPassword = await hashPassword(password);

        await query(
            'INSERT INTO users (uid, email, username, role, password_hash) VALUES (?, ?, ?, ?, ?)',
            [uid, email, username, 'user', hashedPassword]
        );

        const user: SessionUser = { uid, email, username, role: 'user' };
        const cookie = makeSessionCookie(user);

        return NextResponse.json(
            { success: true, user },
            { status: 201, headers: { 'Set-Cookie': cookie } }
        );
    } catch (error: any) {
        console.error('Signup error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
