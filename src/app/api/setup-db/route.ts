import { NextRequest, NextResponse } from "next/server";
import { initDatabase } from "@/lib/supabase-db";

export async function GET() {
  try {
    // Only allow in development or with a secret key for security
    const isDevelopment = process.env.NODE_ENV === 'development';
    const setupKey = process.env.SETUP_KEY || 'ajaia-setup-2024';

    // In production, require a setup key for security
    if (!isDevelopment && (!process.env.SETUP_KEY || process.env.SETUP_KEY !== setupKey)) {
      return NextResponse.json(
        { error: "Database setup requires authorization" },
        { status: 403 }
      );
    }

    console.log('Initializing Supabase database...');
    const sql = await initDatabase();

    return NextResponse.json({
      success: true,
      message: "Database setup SQL generated. Run this in your Supabase SQL Editor:",
      sql: sql
    });
  } catch (error) {
    console.error('Database setup failed:', error);
    return NextResponse.json(
      { error: "Database setup failed", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}