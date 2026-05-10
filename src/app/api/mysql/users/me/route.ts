import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import { getSessionFromCookie } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get('viagraph_session')?.value;
        const session = getSessionFromCookie(sessionToken ? `viagraph_session=${sessionToken}` : null);

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

        const users = await query<any[]>(
            'SELECT uid, email, username, role, password_changed_at, security_question FROM users WHERE uid = ?',
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
