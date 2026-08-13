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

function computeFitnessScore(formData: Record<string, any>): {
  score: number;
  healthStatus: 'Cleared' | 'Medical Review Required' | 'Blocked';
} {
  if (
    formData.substances === 'yes-regularly' ||
    formData.criminalRecord === 'yes' ||
    formData.underInvestigation === 'yes' ||
    formData.disciplinaryAction === 'yes'
  ) {
    return { score: 0, healthStatus: 'Blocked' };
  }

  let score = 0;

  let heightInM = Number(formData.height) || 0;
  let weightInKg = Number(formData.weight) || 0;
  if (formData.heightUnit === 'ft') heightInM = heightInM * 0.3048;
  else heightInM = heightInM / 100;
  if (formData.weightUnit === 'lbs') weightInKg = weightInKg * 0.453592;

  if (heightInM > 0 && weightInKg > 0) {
    const bmi = weightInKg / (heightInM * heightInM);
    if (bmi >= 18.5 && bmi < 25) score += 30;
    else if (bmi >= 17 && bmi < 30) score += 15;
    else score += 5;
  }

  if (formData.chronicDisease === 'no') score += 15;
  else if (formData.chronicDisease === 'yes') score += 0;

  if (formData.injury === 'no') score += 15;
  else if (formData.injury === 'yes-past') score += 10;
  else score += 0;

  if (formData.substances === 'no') score += 15;
  else if (formData.substances === 'yes-occasionally') score += 7;

  if (formData.stress === 'never') score += 10;
  else if (formData.stress === 'rarely') score += 8;
  else if (formData.stress === 'sometimes') score += 5;
  else score += 0;

  if (formData.medications === 'no') score += 10;
  else if (formData.medications === 'yes-occasionally') score += 5;

  if (formData.criminalRecord === 'no') score += 5;

  const needsReview =
    formData.chronicDisease === 'yes' ||
    formData.injury === 'yes-recent' ||
    formData.medications === 'yes-daily' ||
    formData.stress === 'often';

  const healthStatus = needsReview ? 'Medical Review Required' : 'Cleared';

  return { score: Math.min(100, Math.max(0, score)), healthStatus };
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { userId, formData } = data;

    if (!userId || !formData) {
      return NextResponse.json({ message: 'Missing user ID or form data.' }, { status: 400 });
    }

    const { score: fitnessScore, healthStatus } = computeFitnessScore(formData);

    let heightInCm = Number(formData.height);
    if (formData.heightUnit === 'ft') heightInCm = heightInCm * 30.48;
    let weightInKg = Number(formData.weight);
    if (formData.weightUnit === 'lbs') weightInKg = weightInKg * 0.453592;

    const supabase = getSupabaseServerClient();

    // 1. Upsert fitness_health_data
    const { error: fitnessError } = await supabase
      .from('fitness_health_data')
      .upsert({
        user_id: userId,
        height_cm: heightInCm,
        weight_kg: weightInKg,
        age: formData.age,
        gender: formData.gender,
        experience: formData.experience || '',
        chronic_disease: formData.chronicDisease,
        chronic_disease_details: formData.chronicDiseaseDetails || '',
        injury: formData.injury,
        injury_details: formData.injuryDetails || '',
        substances: formData.substances,
        stress: formData.stress,
        medications: formData.medications,
        medication_details: formData.medicationDetails || '',
        criminal_record: formData.criminalRecord,
        criminal_record_details: formData.criminalRecordDetails || '',
        under_investigation: formData.underInvestigation,
        disciplinary_action: formData.disciplinaryAction,
        disciplinary_action_details: formData.disciplinaryActionDetails || '',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (fitnessError) {
      console.error('Error saving fitness_health_data:', fitnessError);
    }

    // 2. Update health_status in users table
    await supabase.from('users').update({ health_status: healthStatus }).eq('id', userId);

    // 3. Upsert fitness_score in athlete_scores
    const { data: existing } = await supabase
      .from('athlete_scores')
      .select('excellence_score, video_analysis_score')
      .eq('user_id', userId)
      .maybeSingle();

    const excellenceScore = existing?.excellence_score || 0;
    const videoScore      = existing?.video_analysis_score || 0;
    const overallScore = Math.round(
      excellenceScore * W_EXCELLENCE +
      fitnessScore    * W_FITNESS    +
      videoScore      * W_VIDEO
    );
    const tier = classifyTier(overallScore);

    await supabase
      .from('athlete_scores')
      .upsert({
        user_id: userId,
        fitness_score: fitnessScore,
        overall_score: overallScore,
        tier: tier,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    return NextResponse.json({
      message: 'Fitness details saved successfully.',
      fitness_score: fitnessScore,
      health_status: healthStatus,
      overall_score: overallScore,
      tier,
    });

  } catch (error) {
    console.error('Error saving fitness details:', error);
    return NextResponse.json({ message: 'Failed to save details.' }, { status: 500 });
  }
}
