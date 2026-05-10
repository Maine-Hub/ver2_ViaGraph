import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import { verifyPassword } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const { identifier, securityAnswer } = await request.json();
        
        if (!identifier || !securityAnswer) {
            return NextResponse.json({ success: false, message: 'All fields are required.' }, { status: 400 });
        }

        const users = await query<any[]>(
            'SELECT security_answer_hash FROM users WHERE email = ? OR username = ?',
            [identifier, identifier]
        );

        if (users.length === 0) {
            return NextResponse.json({ success: false, message: 'Account not found.' }, { status: 404 });
        }

        const user = users[0];

        if (!user.security_answer_hash) {
            return NextResponse.json({ success: false, message: 'No security question set.' }, { status: 400 });
        }

        const isValid = await verifyPassword(securityAnswer.toLowerCase().trim(), user.security_answer_hash);
        
        if (isValid) {
            return NextResponse.json({ success: true, message: 'Answer verified.' });
        } else {
            return NextResponse.json({ success: false, message: 'Incorrect security answer.' }, { status: 401 });
        }
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
