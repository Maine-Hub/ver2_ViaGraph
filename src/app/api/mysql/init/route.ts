import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import { calculateFare, calculateDiscountedFare } from '@/lib/fare';

export async function POST() {
  try {
    // ... (table creation logic remains the same)
    // 1. Create/Alter tables
    await query(`CREATE TABLE IF NOT EXISTS nodes (id VARCHAR(100) PRIMARY KEY, name VARCHAR(255) NOT NULL, latitude DOUBLE NOT NULL, longitude DOUBLE NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
    await query(`CREATE TABLE IF NOT EXISTS users (uid VARCHAR(128) PRIMARY KEY, email VARCHAR(255) NOT NULL UNIQUE, username VARCHAR(255), role ENUM('user', 'admin') DEFAULT 'user', password_hash VARCHAR(255), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
    await query(`CREATE TABLE IF NOT EXISTS routes (name VARCHAR(255) PRIMARY KEY, description TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
    await query(`CREATE TABLE IF NOT EXISTS edges (id VARCHAR(300) PRIMARY KEY, source VARCHAR(100) NOT NULL, target VARCHAR(100) NOT NULL, distance DOUBLE NOT NULL, route_name VARCHAR(255) NOT NULL, stop_and_transfer TEXT, note TEXT, path_coordinates LONGTEXT, regular_fare DECIMAL(10,2), discounted_fare DECIMAL(10,2), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);

    await query(`ALTER TABLE edges ADD COLUMN IF NOT EXISTS path_coordinates LONGTEXT`).catch(() => { });
    await query(`ALTER TABLE edges ADD COLUMN IF NOT EXISTS note TEXT`).catch(() => { });
    await query(`ALTER TABLE edges ADD COLUMN IF NOT EXISTS regular_fare DECIMAL(10,2)`).catch(() => { });
    await query(`ALTER TABLE edges ADD COLUMN IF NOT EXISTS discounted_fare DECIMAL(10,2)`).catch(() => { });

    await query(`CREATE TABLE IF NOT EXISTS transfers (id VARCHAR(300) PRIMARY KEY, from_node_id VARCHAR(100) NOT NULL, to_node_id VARCHAR(100) NOT NULL, name VARCHAR(500), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
    await query(`CREATE TABLE IF NOT EXISTS transfer_legs (id VARCHAR(300) PRIMARY KEY, transfer_id VARCHAR(300) NOT NULL, leg_order INT NOT NULL DEFAULT 0, route_name VARCHAR(255) NOT NULL, distance DOUBLE NOT NULL, stop_and_transfer TEXT, note TEXT, path_coordinates LONGTEXT, regular_fare DECIMAL(10,2), discounted_fare DECIMAL(10,2), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);

    await query(`ALTER TABLE transfer_legs ADD COLUMN IF NOT EXISTS note TEXT`).catch(() => { });
    await query(`ALTER TABLE transfer_legs ADD COLUMN IF NOT EXISTS regular_fare DECIMAL(10,2)`).catch(() => { });
    await query(`ALTER TABLE transfer_legs ADD COLUMN IF NOT EXISTS discounted_fare DECIMAL(10,2)`).catch(() => { });

    // 2. Data Migration: Populate missing fares for existing records
    const existingEdges = await query<any[]>('SELECT id, distance FROM edges WHERE regular_fare IS NULL OR regular_fare = 0');
    for (const edge of existingEdges) {
      const reg = calculateFare(edge.distance);
      const disc = calculateDiscountedFare(edge.distance);
      await query('UPDATE edges SET regular_fare = ?, discounted_fare = ? WHERE id = ?', [reg, disc, edge.id]);
    }

    const existingLegs = await query<any[]>('SELECT id, distance FROM transfer_legs WHERE regular_fare IS NULL OR regular_fare = 0');
    for (const leg of existingLegs) {
      const reg = calculateFare(leg.distance);
      const disc = calculateDiscountedFare(leg.distance);
      await query('UPDATE transfer_legs SET regular_fare = ?, discounted_fare = ? WHERE id = ?', [reg, disc, leg.id]);
    }

    return NextResponse.json({ success: true, message: 'MySQL tables updated and fares populated successfully.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
