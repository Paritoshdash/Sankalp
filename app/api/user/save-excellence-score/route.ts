import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseClient';

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
    const { userId, excellenceScore } = await request.json();

    if (!userId || excellenceScore === undefined || excellenceScore === null) {
      return NextResponse.json({ message: 'Missing userId or excellenceScore.' }, { status: 400 });
    }

    const score = Math.max(0, Math.min(100, Number(excellenceScore)));
    if (isNaN(score)) {
      return NextResponse.json({ message: 'excellenceScore must be a number.' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();

    // Get current fitness and video scores to recompute overall
    const { data: existing } = await supabase
      .from('athlete_scores')
      .select('fitness_score, video_analysis_score')
      .eq('user_id', userId)
      .maybeSingle();

    const fitnessScore = Number(existing?.fitness_score ?? 0);
    const videoScore   = Number(existing?.video_analysis_score ?? 0);
    const overallScore = Math.round(
      score        * W_EXCELLENCE +
      fitnessScore * W_FITNESS    +
      videoScore   * W_VIDEO
    );
    const tier = classifyTier(overallScore);

    const { error: upsertError } = await supabase
      .from('athlete_scores')
      .upsert({
        user_id: userId,
        excellence_score: score,
        overall_score: overallScore,
        tier: tier,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (upsertError) {
      console.error('Supabase save excellence score error:', upsertError);
    }

    return NextResponse.json({
      message: 'Excellence score saved.',
      excellence_score: score,
      overall_score: overallScore,
      tier,
    });
  } catch (error) {
    console.error('Error saving excellence score:', error);
    return NextResponse.json({ message: 'Failed to save excellence score.' }, { status: 500 });
  }
}
