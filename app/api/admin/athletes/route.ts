import { NextResponse, NextRequest } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sport  = searchParams.get('sport')  || '';
    const state  = searchParams.get('state')  || '';
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';
    const page   = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit  = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const offset = (page - 1) * limit;

    // Build dynamic WHERE clauses
    const conditions: string[] = [];
    const params: any[] = [];

    if (sport) {
      conditions.push('us.sport_name = ?');
      params.push(sport);
    }
    if (state) {
      conditions.push('u.state = ?');
      params.push(state);
    }
    if (status) {
      conditions.push('u.validation_status = ?');
      params.push(status);
    }
    if (search) {
      conditions.push('(u.full_name LIKE ? OR CONCAT("ATH", LPAD(u.id, 3, "0")) LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT
        CONCAT('ATH', LPAD(u.id, 3, '0'))        AS id,
        u.id                                       AS userId,
        u.full_name                                AS fullName,
        us.sport_name                              AS sport,
        u.state,
        u.district,
        DATE_FORMAT(u.registered_at, '%Y-%m-%d')   AS registrationDate,
        COALESCE(u.validation_status, 'Pending')   AS validationStatus,
        COALESCE(sc.excellence_score, 0)           AS excellenceScore,
        COALESCE(sc.fitness_score, 0)              AS fitnessScore,
        COALESCE(sc.video_analysis_score, 0)       AS videoAnalysisScore,
        COALESCE(sc.overall_score, 0)              AS overallScore,
        COALESCE(sc.tier, 'Beginner')              AS tier,
        TIMESTAMPDIFF(YEAR, u.date_of_birth, CURDATE()) AS age,
        u.phone,
        u.gmail                                    AS email,
        COALESCE(u.health_status, 'Cleared')       AS healthStatus,
        sc.technique_score                         AS techniqueScore,
        sc.performance_score                       AS performanceScore,
        sc.analysis_timestamp                      AS analysisTimestamp,
        sc.model_version                           AS modelVersion,
        sc.video_metrics_json                      AS videoMetricsJson
      FROM
        users u
      LEFT JOIN user_sports us   ON u.id = us.user_id
      LEFT JOIN athlete_scores sc ON u.id = sc.user_id
      ${whereClause}
      ORDER BY COALESCE(sc.overall_score, 0) DESC
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM users u
      LEFT JOIN user_sports us ON u.id = us.user_id
      ${whereClause}
    `;

    const [rows] = await pool.query(query, [...params, limit, offset]) as any[];
    const [countRows] = await pool.query(countQuery, params) as any[];

    const total = Array.isArray(countRows) && countRows.length > 0
      ? (countRows[0] as any).total
      : 0;

    // Parse JSON metrics field safely
    const athletes = Array.isArray(rows)
      ? rows.map((row: any) => ({
          ...row,
          videoMetricsJson: row.videoMetricsJson
            ? (typeof row.videoMetricsJson === 'string'
                ? JSON.parse(row.videoMetricsJson)
                : row.videoMetricsJson)
            : null,
        }))
      : [];

    return NextResponse.json({
      athletes,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Failed to fetch athlete data:', error);
    return NextResponse.json({ message: 'Failed to fetch athlete data.' }, { status: 500 });
  }
}
