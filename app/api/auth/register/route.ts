import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcrypt';

export async function POST(request: Request) {
  try {
    const { 
      fullName, username, gmail, aadhaar, phone, 
      password, state, district, city, pincode 
    } = await request.json();

    if (!fullName || !username || !aadhaar || !phone || !password) {
      return NextResponse.json({ message: "Required fields must be filled" }, { status: 400 });
    }

    const [existingUsers] = await pool.query(
      'SELECT * FROM users WHERE username = ? OR aadhaar = ? OR (gmail = ? AND gmail IS NOT NULL AND gmail != "")',
      [username, aadhaar, gmail]
    );

    if (Array.isArray(existingUsers) && existingUsers.length > 0) {
      return NextResponse.json({ message: 'A user with this Username, Aadhaar, or Gmail already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      'INSERT INTO users (full_name, username, gmail, aadhaar, phone, password, state, district, city, pincode) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [fullName, username, gmail, aadhaar, phone, hashedPassword, state, district, city, pincode]
    );

    return NextResponse.json({ message: 'User registered successfully!' }, { status: 201 });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'An error occurred during registration' }, { status: 500 });
  }
}