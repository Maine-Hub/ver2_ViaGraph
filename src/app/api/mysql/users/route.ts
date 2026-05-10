import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import { getSessionFromCookie } from '@/lib/auth';
import { recordActivity } from '@/lib/activity-logger';
import { cookies } from 'next/headers';

export async function GET() {
    try {
        // Ensure column exists for persistent tracking (robust check for all MySQL versions)
        const columns = await query<any[]>('SHOW COLUMNS FROM users LIKE "password_changed_at"');
        if (columns.length === 0) {
            await query('ALTER TABLE users ADD COLUMN password_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
        }
        
        const users = await query<any[]>('SELECT uid, email, username, role, password_changed_at FROM users ORDER BY username ASC');
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

        // Record activity
        const cookieStore = await cookies();
        const session = getSessionFromCookie(cookieStore.get('viagraph_session')?.value ?? null);
        const targetUser = await query<any[]>('SELECT username FROM users WHERE uid = ?', [uid]);
        const targetUsername = targetUser[0]?.username ?? uid;

        await recordActivity({
            uid: session?.uid ?? 'system',
            username: session?.username ?? 'System',
            action: 'Updated User Role',
            details: `Changed role of ${targetUsername} to ${role}`,
            category: 'admin'
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
export async function PUT(request: Request) {
    try {
        const { username } = await request.json();
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get('viagraph_session')?.value;
        const session = getSessionFromCookie(sessionToken ? `viagraph_session=${sessionToken}` : null);

        if (!session?.uid) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        if (!username || username.trim().length < 3) {
            return NextResponse.json({ success: false, message: 'Username must be at least 3 characters.' }, { status: 400 });
        }

        // Update database
        await query('UPDATE users SET username = ? WHERE uid = ?', [username, session.uid]);

        // Record activity
        await recordActivity({
            uid: session.uid,
            username: username,
            action: 'Updated Profile',
            details: `Updated username from ${session.username} to ${username}`,
            category: 'user'
        });

        // Refresh session cookie
        const { exp, iat, nbf, ...cleanSession } = session as any;
        const newUser: any = { ...cleanSession, username };
        const response = NextResponse.json({ success: true, user: newUser });
        
        // We need to sign a new token and set the cookie
        const { signToken } = await import('@/lib/auth');
        const newToken = signToken(newUser);
        response.cookies.set('viagraph_session', newToken, {
            path: '/',
            httpOnly: true,
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60
        });

        return response;
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
