import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import { getSessionFromCookie } from '@/lib/auth';
import { recordActivity } from '@/lib/activity-logger';
import { cookies } from 'next/headers';

export async function GET() {
    try {
        // Ensure columns exist for persistent tracking and security
        const columns = await query<any[]>('SHOW COLUMNS FROM users');
        const colNames = columns.map(c => c.Field);
        
        if (!colNames.includes('password_changed_at')) {
            await query('ALTER TABLE users ADD COLUMN password_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
        }
        if (!colNames.includes('security_question')) {
            await query('ALTER TABLE users ADD COLUMN security_question TEXT');
        }
        if (!colNames.includes('security_answer_hash')) {
            await query('ALTER TABLE users ADD COLUMN security_answer_hash TEXT');
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
        const { username, securityQuestion, securityAnswer } = await request.json();
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get('viagraph_session')?.value;
        const session = getSessionFromCookie(sessionToken ? `viagraph_session=${sessionToken}` : null);

        if (!session?.uid) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        if (username) {
            if (username.trim().length < 3) {
                return NextResponse.json({ success: false, message: 'Username must be at least 3 characters.' }, { status: 400 });
            }
            await query('UPDATE users SET username = ? WHERE uid = ?', [username, session.uid]);
        }

        if (securityQuestion && securityAnswer) {
            const { hashPassword } = await import('@/lib/auth');
            const hashedAnswer = await hashPassword(securityAnswer.toLowerCase().trim());
            await query('UPDATE users SET security_question = ?, security_answer_hash = ? WHERE uid = ?', [securityQuestion, hashedAnswer, session.uid]);
        }

        // Record activity
        await recordActivity({
            uid: session.uid,
            username: username || session.username,
            action: 'Updated Profile',
            details: `Updated profile settings (Username: ${username || 'unchanged'}, Security Question: ${securityQuestion ? 'Updated' : 'unchanged'})`,
            category: 'user'
        });

        // Refresh session cookie
        const { exp, iat, nbf, ...cleanSession } = session as any;
        const newUser: any = { ...cleanSession };
        if (username) newUser.username = username;
        
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

