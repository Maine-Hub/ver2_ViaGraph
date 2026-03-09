import { NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/auth';

export async function GET(request: Request) {
    const cookieHeader = request.headers.get('cookie');
    const user = getSessionFromCookie(cookieHeader);

    if (!user) {
        return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({ user });
}
