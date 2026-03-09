import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import { verifyPassword, makeSessionCookie, SessionUser } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ success: false, message: 'Email and password are required.' }, { status: 400 });
        }

        const rows = await query<any[]>(
            'SELECT uid, email, username, role, password_hash FROM users WHERE email = ?',
            [email]
        );

        if (rows.length === 0) {
            return NextResponse.json({ success: false, message: 'Invalid email or password.' }, { status: 401 });
        }

        const dbUser = rows[0];
        const valid = await verifyPassword(password, dbUser.password_hash);
        if (!valid) {
            return NextResponse.json({ success: false, message: 'Invalid email or password.' }, { status: 401 });
        }

        const user: SessionUser = {
            uid: dbUser.uid,
            email: dbUser.email,
            username: dbUser.username,
            role: dbUser.role,
        };
        const cookie = makeSessionCookie(user);

        return NextResponse.json(
            { success: true, user },
            { headers: { 'Set-Cookie': cookie } }
        );
    } catch (error: any) {
        console.error('Signin error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
