import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category'); // 'user' or 'admin'

        let sql = 'SELECT id, uid, username, action, details, category, created_at FROM activity_logs';
        let params: any[] = [];

        if (category) {
            sql += ' WHERE category = ?';
            params.push(category);
        }

        sql += ' ORDER BY created_at DESC LIMIT 200';

        const logs = await query<any[]>(sql, params);

        return NextResponse.json({ success: true, logs });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
