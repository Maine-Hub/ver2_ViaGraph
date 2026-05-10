import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import { getSessionFromCookie } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get('viagraph_session')?.value;
        const session = getSessionFromCookie(sessionToken ? `viagraph_session=${sessionToken}` : null);

        if (!session?.uid) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        // Ensure column exists for persistent tracking (robust check for all MySQL versions)
        const columns = await query<any[]>('SHOW COLUMNS FROM users LIKE "password_changed_at"');
        if (columns.length === 0) {
            await query('ALTER TABLE users ADD COLUMN password_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
        }

        const users = await query<any[]>(
            'SELECT uid, email, username, role, password_changed_at FROM users WHERE uid = ?',
            [session.uid]
        );

        if (users.length === 0) {
            return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, user: users[0] });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
