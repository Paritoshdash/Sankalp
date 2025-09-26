import { NextResponse, NextRequest } from 'next/server';
import pool from '@/lib/db';

// Handles checking if a selection already exists
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ message: "User ID is required" }, { status: 400 });
    }

    const [rows] = await pool.query(
      'SELECT sport_name, skill_level, sport_id FROM user_sports WHERE user_id = ?',
      [userId]
    );
    
    const selection = Array.isArray(rows) ? rows[0] : null;

    return NextResponse.json({ selection });

  } catch (error) {
    console.error("Error fetching sport selection:", error);
    return NextResponse.json({ message: 'Failed to fetch sport selection.' }, { status: 500 });
  }
}

// Handles saving a new selection
export async function POST(request: Request) {
  try {
    const { userId, sportName, sportCategory, skillLevel, sportId } = await request.json();

    if (!userId || !sportName || !sportCategory || !skillLevel || !sportId) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    // A simple INSERT. The database's UNIQUE key on user_id will reject any duplicates.
    const query = `
      INSERT INTO user_sports (user_id, sport_name, sport_category, skill_level, sport_id)
      VALUES (?, ?, ?, ?, ?)
    `;

    await pool.query(query, [userId, sportName, sportCategory, skillLevel, sportId]);

    return NextResponse.json({ message: 'Sport selection saved successfully!' });

  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ message: 'A sport has already been selected for this user.' }, { status: 409 });
    }
    console.error("Error saving sport selection:", error);
    return NextResponse.json({ message: 'Failed to save sport selection.' }, { status: 500 });
  }
}