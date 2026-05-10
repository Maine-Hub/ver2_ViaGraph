import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql';

// POST: insert or update a node
export async function POST(request: Request) {
    try {
        const { id, name, latitude, longitude } = await request.json();
        await query(
            `INSERT INTO nodes (id, name, latitude, longitude)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name=VALUES(name), latitude=VALUES(latitude), longitude=VALUES(longitude)`,
            [id, name, latitude, longitude]
        );
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
