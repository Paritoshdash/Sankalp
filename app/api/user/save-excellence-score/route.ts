import { NextResponse } from 'next/server';
import pool from '@/lib/db';

const W_EXCELLENCE = 0.30;
const W_FITNESS    = 0.30;
const W_VIDEO      = 0.40;

function classifyTier(score: number): string {
  if (score >= 75) return 'Advanced';
  if (score >= 50) return 'Intermediate';
  return 'Beginner';
}

export async function POST(request: Request) {
  const connection = await pool.getConnection();
  try {
    const { userId, excellenceScore } = await request.json();

    if (!userId || excellenceScore === undefined || excellenceScore === null) {
      return NextResponse.json({ message: 'Missing userId or excellenceScore.' }, { status: 400 });
    }

    const score = Math.max(0, Math.min(100, Number(excellenceScore)));
    if (isNaN(score)) {
      return NextResponse.json({ message: 'excellenceScore must be a number.' }, { status: 400 });
    }

    await connection.beginTransaction();

    // Get current fitness and video scores to recompute overall
    const [rows] = await connection.query(
      'SELECT fitness_score, video_analysis_score FROM athlete_scores WHERE user_id = ?',
      [userId]
    ) as any[];
    const existing = Array.isArray(rows) && rows.length > 0
      ? rows[0]
      : { fitness_score: 0, video_analysis_score: 0 };

    const fitnessScore = Number(existing.fitness_score ?? 0);
    const videoScore   = Number(existing.video_analysis_score ?? 0);
    const overallScore = Math.round(
      score        * W_EXCELLENCE +
      fitnessScore * W_FITNESS    +
      videoScore   * W_VIDEO
    );
    const tier = classifyTier(overallScore);

    await connection.query(`
      INSERT INTO athlete_scores (user_id, excellence_score, overall_score, tier)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        excellence_score = VALUES(excellence_score),
        overall_score    = VALUES(overall_score),
        tier             = VALUES(tier)
    `, [userId, score, overallScore, tier]);

    await connection.commit();

    return NextResponse.json({
      message: 'Excellence score saved.',
      excellence_score: score,
      overall_score: overallScore,
      tier,
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error saving excellence score:', error);
    return NextResponse.json({ message: 'Failed to save excellence score.' }, { status: 500 });
  } finally {
    connection.release();
  }
}
