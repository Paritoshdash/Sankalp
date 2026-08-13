import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseClient';

const PYTHON_BACKEND_URL = process.env.ML_BACKEND_URL || 'http://127.0.0.1:8000';

const ALLOWED_TYPES = new Set([
  'video/mp4', 'video/quicktime', 'video/x-msvideo',
  'video/webm', 'video/mpeg', 'video/3gpp',
]);
const MAX_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB

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
        signal: AbortSignal.timeout(120_000),
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

    // Persist to Supabase if userId is provided
    if (userId) {
      const supabase = getSupabaseServerClient();
      try {
        const { data: existing } = await supabase
          .from('athlete_scores')
          .select('excellence_score, fitness_score')
          .eq('user_id', userId)
          .maybeSingle();

        const excellenceScore = existing?.excellence_score || 0;
        const fitnessScore    = existing?.fitness_score || 0;

        const overallScore = Math.round(
          excellenceScore * W_EXCELLENCE +
          fitnessScore    * W_FITNESS    +
          videoScore      * W_VIDEO
        );
        const tier = classifyTier(overallScore);

        const { error: upsertError } = await supabase
          .from('athlete_scores')
          .upsert({
            user_id: userId,
            video_analysis_score: videoScore,
            overall_score: overallScore,
            tier: tier,
            video_metrics_json: mlData.metrics,
            technique_score: mlData.technique_score ?? 0,
            performance_score: mlData.performance_score ?? 0,
            analysis_timestamp: new Date().toISOString(),
            model_version: mlData.model?.version ?? '1.0.0',
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });

        if (upsertError) {
          console.error('Supabase upsert error:', upsertError);
        }

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
        console.error('DB error saving analysis results:', dbErr);
        return NextResponse.json({
          success: true,
          ...mlData,
          saved: null,
          db_warning: 'Analysis completed but score could not be saved to database.',
        });
      }
    }

    return NextResponse.json({ success: true, ...mlData });

  } catch (error: any) {
    console.error('Analyze route error:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' },
    }, { status: 500 });
  }
}
