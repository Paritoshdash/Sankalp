import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// ✅ Make sure this function is named GET (all uppercase) and is exported.
export async function GET() {
  try {
    const query = `
      SELECT 
        CONCAT('ATH', LPAD(u.id, 3, '0')) AS id,
        u.fullName,
        us.sport_name AS sport,
        u.state,
        u.district,
        DATE_FORMAT(u.registered_at, '%Y-%m-%d') AS registrationDate,
        u.validation_status AS validationStatus,
        sc.excellence_score AS excellenceScore,
        sc.fitness_score AS fitnessScore,
        sc.video_analysis_score AS videoAnalysisScore,
        sc.overall_score AS overallScore,
        sc.tier,
        TIMESTAMPDIFF(YEAR, u.date_of_birth, CURDATE()) AS age,
        u.phone,
        u.gmail AS email,
        u.aadhaar,
        u.health_status AS healthStatus
      FROM 
        users u
      LEFT JOIN 
        user_sports us ON u.id = us.user_id
      LEFT JOIN 
        athlete_scores sc ON u.id = sc.user_id
      ORDER BY u.id DESC;
    `;

    const [rows] = await pool.query(query);

    return NextResponse.json(rows);

  } catch (error) {
    console.error("Failed to fetch athlete data:", error);
    return NextResponse.json({ message: "Failed to fetch athlete data." }, { status: 500 });
  }
}