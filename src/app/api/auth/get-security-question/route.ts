import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql';

export async function POST(request: Request) {
    try {
        const { identifier } = await request.json();
        
        if (!identifier) {
            return NextResponse.json({ success: false, message: 'Identifier is required.' }, { status: 400 });
        }

        const rows = await query<any[]>(
            'SELECT security_question FROM users WHERE email = ? OR username = ?',
            [identifier, identifier]
        );

        if (rows.length === 0) {
            return NextResponse.json({ success: false, message: 'Account not found.' }, { status: 404 });
        }

        if (!rows[0].security_question) {
            return NextResponse.json({ success: false, message: 'No security question set for this account.' }, { status: 400 });
        }

        return NextResponse.json({ success: true, question: rows[0].security_question });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
