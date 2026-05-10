import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql';

export async function POST(request: Request) {
    try {
        const { username } = await request.json();
        
        if (!username) {
            return NextResponse.json({ success: false, message: 'Username is required.' }, { status: 400 });
        }

        const rows = await query<any[]>(
            'SELECT email FROM users WHERE username = ?',
            [username]
        );

        if (rows.length === 0) {
            return NextResponse.json({ success: false, message: 'No account found with this username.' }, { status: 404 });
        }

        const email = rows[0].email;
        // Obfuscate email for privacy: e***e@gmail.com
        const [user, domain] = email.split('@');
        const obfuscated = user.charAt(0) + '*'.repeat(user.length - 2) + user.charAt(user.length - 1) + '@' + domain;

        return NextResponse.json({ success: true, email: obfuscated });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
