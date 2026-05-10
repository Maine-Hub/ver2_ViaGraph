import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import { hashPassword, verifyPassword } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const { identifier, securityAnswer, newPassword } = await request.json();
        
        if (!identifier || !securityAnswer || !newPassword) {
            return NextResponse.json({ success: false, message: 'All fields are required.' }, { status: 400 });
        }

        // Find user by email or username
        const users = await query<any[]>(
            'SELECT uid, security_answer_hash FROM users WHERE email = ? OR username = ?',
            [identifier, identifier]
        );

        if (users.length === 0) {
            return NextResponse.json({ success: false, message: 'Account not found.' }, { status: 404 });
        }

        const user = users[0];

        if (!user.security_answer_hash) {
            return NextResponse.json({ success: false, message: 'No security question set for this account. Please use email recovery.' }, { status: 400 });
        }

        // Verify security answer
        const isValid = await verifyPassword(securityAnswer.toLowerCase().trim(), user.security_answer_hash);
        if (!isValid) {
            return NextResponse.json({ success: false, message: 'Incorrect security answer.' }, { status: 401 });
        }

        if (newPassword.length < 6) {
            return NextResponse.json({ success: false, message: 'New password must be at least 6 characters.' }, { status: 400 });
        }

        // Reset password
        const hashed = await hashPassword(newPassword);
        await query('UPDATE users SET password_hash = ?, password_changed_at = NOW() WHERE uid = ?', [hashed, user.uid]);

        return NextResponse.json({ success: true, message: 'Password reset successfully.' });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
