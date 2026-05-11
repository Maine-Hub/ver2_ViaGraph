import mysql from 'mysql2/promise';

// Connection pool — reused across API calls
const pool = mysql.createPool({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',          // XAMPP default: no password
    database: 'viagraph_experiment',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

export default pool;

// Helper to run a query
export async function query<T = any>(sql: string, params?: any[]): Promise<T> {
    const [rows] = await pool.execute(sql, params);
    return rows as T;
}
