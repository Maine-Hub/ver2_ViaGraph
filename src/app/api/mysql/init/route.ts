import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql';

export async function POST() {
  try {
    // Create nodes table
    await query(`
      CREATE TABLE IF NOT EXISTS nodes (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        latitude DOUBLE NOT NULL,
        longitude DOUBLE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create users table (mirrors signup form data)
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        uid          VARCHAR(128)  PRIMARY KEY,
        email        VARCHAR(255)  NOT NULL UNIQUE,
        username     VARCHAR(255),
        role         ENUM('user', 'admin') DEFAULT 'user',
        password_hash VARCHAR(255),
        created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create routes (jeepney lines) table
    await query(`
      CREATE TABLE IF NOT EXISTS routes (
        name VARCHAR(255) PRIMARY KEY,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create edges (route segments) table
    await query(`
      CREATE TABLE IF NOT EXISTS edges (
        id VARCHAR(300) PRIMARY KEY,
        source VARCHAR(100) NOT NULL,
        target VARCHAR(100) NOT NULL,
        distance DOUBLE NOT NULL,
        route_name VARCHAR(255) NOT NULL,
        stop_and_transfer TEXT,
        fare_details TEXT,
        note TEXT,
        path_coordinates LONGTEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add path_coordinates and note to existing edges table (safe if column already exists)
    await query(`ALTER TABLE edges ADD COLUMN IF NOT EXISTS path_coordinates LONGTEXT`).catch(() => { });
    await query(`ALTER TABLE edges ADD COLUMN IF NOT EXISTS note TEXT`).catch(() => { });

    // Create transfers table (multi-leg routes with transfers)
    await query(`
      CREATE TABLE IF NOT EXISTS transfers (
        id VARCHAR(300) PRIMARY KEY,
        from_node_id VARCHAR(100) NOT NULL,
        to_node_id VARCHAR(100) NOT NULL,
        name VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create transfer_legs table (individual legs of a transfer route)
    await query(`
      CREATE TABLE IF NOT EXISTS transfer_legs (
        id VARCHAR(300) PRIMARY KEY,
        transfer_id VARCHAR(300) NOT NULL,
        leg_order INT NOT NULL DEFAULT 0,
        route_name VARCHAR(255) NOT NULL,
        distance DOUBLE NOT NULL,
        stop_and_transfer TEXT,
        fare_details TEXT,
        note TEXT,
        path_coordinates LONGTEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add note to existing transfer_legs table
    await query(`ALTER TABLE transfer_legs ADD COLUMN IF NOT EXISTS note TEXT`).catch(() => { });

    return NextResponse.json({ success: true, message: 'MySQL tables created successfully.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
