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

/**
 * Compute a fitness score (0-100) from the submitted health form data.
 *
 * Scoring logic (transparent, rule-based):
 *   BMI in healthy range   → +30 pts
 *   No chronic disease      → +15 pts
 *   No recent injury        → +15 pts
 *   No substance use        → +15 pts
 *   Low stress              → +10 pts
 *   No daily medications    → +10 pts
 *   No police/disciplinary  → +5 pts
 *
 * A blocked athlete (substances regularly, criminal record, investigation,
 * disciplinary action) scores 0 and health_status = 'Blocked'.
 */
function computeFitnessScore(formData: Record<string, any>): {
  score: number;
  healthStatus: 'Cleared' | 'Medical Review Required' | 'Blocked';
} {
  // Hard blocks
  if (
    formData.substances === 'yes-regularly' ||
    formData.criminalRecord === 'yes' ||
    formData.underInvestigation === 'yes' ||
    formData.disciplinaryAction === 'yes'
  ) {
    return { score: 0, healthStatus: 'Blocked' };
  }

  let score = 0;

  // BMI (30 pts)
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

  // Health flags (70 pts total)
  if (formData.chronicDisease === 'no') score += 15;
  else if (formData.chronicDisease === 'yes') score += 0; // review needed

  if (formData.injury === 'no') score += 15;
  else if (formData.injury === 'yes-past') score += 10;
  else score += 0; // recent injury

  if (formData.substances === 'no') score += 15;
  else if (formData.substances === 'yes-occasionally') score += 7;

  if (formData.stress === 'never') score += 10;
  else if (formData.stress === 'rarely') score += 8;
  else if (formData.stress === 'sometimes') score += 5;
  else score += 0; // often

  if (formData.medications === 'no') score += 10;
  else if (formData.medications === 'yes-occasionally') score += 5;

  if (formData.criminalRecord === 'no') score += 5;

  // Determine health status
  const needsReview =
    formData.chronicDisease === 'yes' ||
    formData.injury === 'yes-recent' ||
    formData.medications === 'yes-daily' ||
    formData.stress === 'often';

  const healthStatus = needsReview ? 'Medical Review Required' : 'Cleared';

  return { score: Math.min(100, Math.max(0, score)), healthStatus };
}

export async function POST(request: Request) {
  const connection = await pool.getConnection();
  try {
    const data = await request.json();
    const { userId, formData } = data;

    if (!userId || !formData) {
      return NextResponse.json({ message: 'Missing user ID or form data.' }, { status: 400 });
    }

    // Compute fitness score and health status server-side
    const { score: fitnessScore, healthStatus } = computeFitnessScore(formData);

    // Unit conversion
    let heightInCm = Number(formData.height);
    if (formData.heightUnit === 'ft') heightInCm = heightInCm * 30.48;
    let weightInKg = Number(formData.weight);
    if (formData.weightUnit === 'lbs') weightInKg = weightInKg * 0.453592;

    await connection.beginTransaction();

    // 1. Upsert fitness_health_data
    await connection.query(`
      INSERT INTO fitness_health_data
        (user_id, height_cm, weight_kg, age, gender, experience,
         chronic_disease, chronic_disease_details, injury, injury_details,
         substances, stress, medications, medication_details,
         criminal_record, criminal_record_details, under_investigation,
         disciplinary_action, disciplinary_action_details)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        height_cm = VALUES(height_cm), weight_kg = VALUES(weight_kg),
        age = VALUES(age), gender = VALUES(gender), experience = VALUES(experience),
        chronic_disease = VALUES(chronic_disease), chronic_disease_details = VALUES(chronic_disease_details),
        injury = VALUES(injury), injury_details = VALUES(injury_details),
        substances = VALUES(substances), stress = VALUES(stress),
        medications = VALUES(medications), medication_details = VALUES(medication_details),
        criminal_record = VALUES(criminal_record), criminal_record_details = VALUES(criminal_record_details),
        under_investigation = VALUES(under_investigation),
        disciplinary_action = VALUES(disciplinary_action), disciplinary_action_details = VALUES(disciplinary_action_details)
    `, [
      userId, heightInCm, weightInKg, formData.age, formData.gender, formData.experience || '',
      formData.chronicDisease, formData.chronicDiseaseDetails || '',
      formData.injury, formData.injuryDetails || '',
      formData.substances, formData.stress,
      formData.medications, formData.medicationDetails || '',
      formData.criminalRecord, formData.criminalRecordDetails || '',
      formData.underInvestigation,
      formData.disciplinaryAction, formData.disciplinaryActionDetails || '',
    ]);

    // 2. Update health_status in users table
    await connection.query(
      'UPDATE users SET health_status = ? WHERE id = ?',
      [healthStatus, userId]
    );

    // 3. Upsert fitness_score in athlete_scores + recompute overall
    const [existingRows] = await connection.query(
      'SELECT excellence_score, video_analysis_score FROM athlete_scores WHERE user_id = ?',
      [userId]
    ) as any[];
    const existing = Array.isArray(existingRows) && existingRows.length > 0
      ? existingRows[0]
      : { excellence_score: 0, video_analysis_score: 0 };

    const excellenceScore = Number(existing.excellence_score ?? 0);
    const videoScore      = Number(existing.video_analysis_score ?? 0);
    const overallScore = Math.round(
      excellenceScore * W_EXCELLENCE +
      fitnessScore    * W_FITNESS    +
      videoScore      * W_VIDEO
    );
    const tier = classifyTier(overallScore);

    await connection.query(`
      INSERT INTO athlete_scores (user_id, fitness_score, overall_score, tier)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        fitness_score = VALUES(fitness_score),
        overall_score = VALUES(overall_score),
        tier          = VALUES(tier)
    `, [userId, fitnessScore, overallScore, tier]);

    await connection.commit();

    return NextResponse.json({
      message: 'Fitness details saved successfully.',
      fitness_score: fitnessScore,
      health_status: healthStatus,
      overall_score: overallScore,
      tier,
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error saving fitness details:', error);
    return NextResponse.json({ message: 'Failed to save details.' }, { status: 500 });
  } finally {
    connection.release();
  }
}
