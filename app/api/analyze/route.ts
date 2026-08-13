import { NextResponse } from 'next/server';
import pool from '@/lib/db';

const PYTHON_BACKEND_URL = process.env.ML_BACKEND_URL || 'http://127.0.0.1:8000';

const ALLOWED_TYPES = new Set([
  'video/mp4', 'video/quicktime', 'video/x-msvideo',
  'video/webm', 'video/mpeg', 'video/3gpp',
]);
const MAX_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB

// Score weights (must match config.py)
const W_EXCELLENCE = 0.30;
const W_FITNESS    = 0.30;
const W_VIDEO      = 0.40;

function classifyTier(score: number): string {
  if (score >= 75) return 'Advanced';
  if (score >= 50) return 'Intermediate';
  return 'Beginner';
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const videoFile = formData.get('video') as File | null;
    const sport     = formData.get('sport') as string | null;
    const userId    = formData.get('userId') as string | null;
    const athleteAge = parseInt((formData.get('athleteAge') as string) || '18', 10);
    const gender    = (formData.get('gender') as string) || 'male';

    // ── Validation ─────────────────────────────────────────────────────────
    if (!videoFile) {
      return NextResponse.json({ success: false, error: { code: 'MISSING_VIDEO', message: 'No video file provided.' } }, { status: 400 });
    }
    if (!sport) {
      return NextResponse.json({ success: false, error: { code: 'MISSING_SPORT', message: 'Sport parameter is required.' } }, { status: 400 });
    }
    if (videoFile.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ success: false, error: { code: 'FILE_TOO_LARGE', message: `Video exceeds 100 MB limit. Received: ${(videoFile.size / 1024 / 1024).toFixed(1)} MB.` } }, { status: 400 });
    }
    if (!ALLOWED_TYPES.has(videoFile.type)) {
      return NextResponse.json({ success: false, error: { code: 'INVALID_FILE_TYPE', message: `File type '${videoFile.type}' is not supported.` } }, { status: 400 });
    }

    // ── Forward to Python ML service ────────────────────────────────────────
    const mlFormData = new FormData();
    mlFormData.append('video', videoFile);
    mlFormData.append('sport', sport);
    mlFormData.append('athlete_age', athleteAge.toString());
    mlFormData.append('gender', gender);
    if (userId) mlFormData.append('user_id', userId);

    let mlResponse: Response;
    try {
      mlResponse = await fetch(`${PYTHON_BACKEND_URL}/analyze`, {
        method: 'POST',
        body: mlFormData,
        signal: AbortSignal.timeout(120_000), // 2-minute timeout
      });
    } catch (fetchErr: any) {
      const isTimeout = fetchErr?.name === 'TimeoutError';
      return NextResponse.json({
        success: false,
        error: {
          code: isTimeout ? 'ANALYSIS_TIMEOUT' : 'ML_SERVICE_UNAVAILABLE',
          message: isTimeout
            ? 'Analysis timed out. Try a shorter video (under 30 seconds).'
            : 'The ML analysis service is not available. Please ensure the Python backend is running.',
        },
      }, { status: 503 });
    }

    const mlData = await mlResponse.json();

    if (!mlResponse.ok || !mlData.success) {
      return NextResponse.json({
        success: false,
        error: mlData.error || { code: 'ANALYSIS_FAILED', message: 'Analysis failed on the ML backend.' },
      }, { status: mlResponse.status });
    }

    const videoScore: number = mlData.overall_video_score ?? 0;

    // ── Persist to database if userId is provided ───────────────────────────
    if (userId) {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        // Get existing scores to compute overall
        const [existingRows] = await connection.query(
          'SELECT excellence_score, fitness_score FROM athlete_scores WHERE user_id = ?',
          [userId]
        ) as any[];
        const existing = Array.isArray(existingRows) && existingRows.length > 0
          ? existingRows[0]
          : { excellence_score: 0, fitness_score: 0 };

        const excellenceScore: number = Number(existing.excellence_score ?? 0);
        const fitnessScore: number    = Number(existing.fitness_score ?? 0);
        const overallScore = Math.round(
          excellenceScore * W_EXCELLENCE +
          fitnessScore    * W_FITNESS    +
          videoScore      * W_VIDEO
        );
        const tier = classifyTier(overallScore);

        // Upsert athlete_scores
        await connection.query(`
          INSERT INTO athlete_scores
            (user_id, video_analysis_score, overall_score, tier,
             video_metrics_json, technique_score, performance_score,
             analysis_timestamp, model_version)
          VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?)
          ON DUPLICATE KEY UPDATE
            video_analysis_score = VALUES(video_analysis_score),
            overall_score        = VALUES(overall_score),
            tier                 = VALUES(tier),
            video_metrics_json   = VALUES(video_metrics_json),
            technique_score      = VALUES(technique_score),
            performance_score    = VALUES(performance_score),
            analysis_timestamp   = VALUES(analysis_timestamp),
            model_version        = VALUES(model_version)
        `, [
          userId,
          videoScore,
          overallScore,
          tier,
          JSON.stringify(mlData.metrics),
          mlData.technique_score ?? 0,
          mlData.performance_score ?? 0,
          mlData.model?.version ?? '1.0.0',
        ]);

        // Mark validation_status as 'Pending' if it was null/empty
        await connection.query(`
          UPDATE users SET validation_status = COALESCE(NULLIF(validation_status, ''), 'Pending')
          WHERE id = ?
        `, [userId]);

        await connection.commit();

        return NextResponse.json({
          success: true,
          ...mlData,
          saved: {
            video_analysis_score: videoScore,
            overall_score: overallScore,
            tier,
          },
        });
      } catch (dbErr) {
        await connection.rollback();
        console.error('DB error saving analysis results:', dbErr);
        // Return the ML result even if DB save fails
        return NextResponse.json({
          success: true,
          ...mlData,
          saved: null,
          db_warning: 'Analysis completed but score could not be saved to database.',
        });
      } finally {
        connection.release();
      }
    }

    // No userId — return result without saving
    return NextResponse.json({ success: true, ...mlData });

  } catch (error: any) {
    console.error('Analyze route error:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' },
    }, { status: 500 });
  }
}
