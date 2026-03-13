import { query } from './mysql';

export async function recordActivity({
    uid,
    username,
    action,
    details,
    category
}: {
    uid: string;
    username?: string;
    action: string;
    details?: string;
    category: 'user' | 'admin';
}) {
    try {
        await query(
            'INSERT INTO activity_logs (uid, username, action, details, category) VALUES (?, ?, ?, ?, ?)',
            [uid, username ?? null, action, details ?? null, category]
        );
        return true;
    } catch (error) {
        console.error('Failed to record activity:', error);
        return false;
    }
}
