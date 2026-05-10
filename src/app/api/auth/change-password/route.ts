import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import { getSessionFromCookie, verifyPassword, hashPassword, signToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { recordActivity } from '@/lib/activity-logger';

export async function POST(request: Request) {
    try {
        const { currentPassword, newPassword } = await request.json();
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get('viagraph_session')?.value;
        const session = getSessionFromCookie(sessionToken ? `viagraph_session=${sessionToken}` : null);

        if (!session?.uid) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        // Get user from DB to check password
        const users = await query<any[]>('SELECT password_hash FROM users WHERE uid = ?', [session.uid]);
        if (users.length === 0) {
            return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
        }

        const isValid = await verifyPassword(currentPassword, users[0].password_hash);
        if (!isValid) {
            return NextResponse.json({ success: false, message: 'Current password is incorrect' }, { status: 400 });
        }

        if (newPassword.length < 6) {
            return NextResponse.json({ success: false, message: 'New password must be at least 6 characters' }, { status: 400 });
        }

        // Ensure column exists for persistent tracking (robust check for all MySQL versions)
        const columns = await query<any[]>('SHOW COLUMNS FROM users LIKE "password_changed_at"');
        if (columns.length === 0) {
            await query('ALTER TABLE users ADD COLUMN password_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
        }

        const hashed = await hashPassword(newPassword);
        await query('UPDATE users SET password_hash = ?, password_changed_at = NOW() WHERE uid = ?', [hashed, session.uid]);

        await recordActivity({
            uid: session.uid,
            username: session.username,
            action: 'Changed Password',
            details: 'User successfully updated their password',
            category: 'user'
        });

        return NextResponse.json({ success: true, message: 'Password updated successfully' });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
