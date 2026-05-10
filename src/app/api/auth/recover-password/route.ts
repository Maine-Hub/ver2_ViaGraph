import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql';

export async function POST(request: Request) {
    try {
        const { email } = await request.json();
        
        if (!email) {
            return NextResponse.json({ success: false, message: 'Email is required.' }, { status: 400 });
        }

        const rows = await query<any[]>(
            'SELECT uid FROM users WHERE email = ?',
            [email]
        );

        if (rows.length === 0) {
            return NextResponse.json({ success: false, message: 'No account found with this email address.' }, { status: 404 });
        }

        // In a real app, we would generate a JWT token and send an email.
        // For this implementation, we simulate success.
        
        return NextResponse.json({ success: true, message: 'Recovery link sent.' });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
