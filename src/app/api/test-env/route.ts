import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    AUTH_GITHUB_ID: process.env.AUTH_GITHUB_ID || "UNDEFINED",
    AUTH_GITHUB_SECRET: process.env.AUTH_GITHUB_SECRET || "UNDEFINED",
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "UNDEFINED",
    type: typeof process.env.AUTH_GITHUB_ID,
  });
}
