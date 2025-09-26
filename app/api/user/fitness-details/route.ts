import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
  const connection = await pool.getConnection();
  try {
    const data = await request.json();
    const { userId, formData } = data;

    if (!userId || !formData) {
      return NextResponse.json({ message: "Missing user ID or form data." }, { status: 400 });
    }

    // --- Server-side determination of health status ---
    let healthStatus: 'Cleared' | 'Medical Review Required' | 'Blocked' = 'Cleared';
    if (formData.chronicDisease === 'yes' || formData.injury === 'yes-recent' || formData.medications === 'yes-daily' || formData.stress === 'often') {
        healthStatus = 'Medical Review Required';
    }
    if (formData.substances === 'yes-regularly' || formData.criminalRecord === 'yes' || formData.underInvestigation === 'yes' || formData.disciplinaryAction === 'yes') {
        healthStatus = 'Blocked';
    }

    // --- Unit Conversion ---
    let heightInCm = Number(formData.height);
    if (formData.heightUnit === 'ft') {
      heightInCm = heightInCm * 30.48; // ft to cm
    }
    let weightInKg = Number(formData.weight);
    if (formData.weightUnit === 'lbs') {
      weightInKg = weightInKg * 0.453592; // lbs to kg
    }

    // --- Database Transaction ---
    await connection.beginTransaction();

    // 1. Insert or Update fitness_health_data
    const upsertFitnessQuery = `
      INSERT INTO fitness_health_data (user_id, height_cm, weight_kg, age, gender, experience, chronic_disease, chronic_disease_details, injury, injury_details, substances, stress, medications, medication_details, criminal_record, criminal_record_details, under_investigation, disciplinary_action, disciplinary_action_details)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        height_cm = VALUES(height_cm), weight_kg = VALUES(weight_kg), age = VALUES(age), gender = VALUES(gender), experience = VALUES(experience),
        chronic_disease = VALUES(chronic_disease), chronic_disease_details = VALUES(chronic_disease_details),
        injury = VALUES(injury), injury_details = VALUES(injury_details),
        substances = VALUES(substances), stress = VALUES(stress),
        medications = VALUES(medications), medication_details = VALUES(medication_details),
        criminal_record = VALUES(criminal_record), criminal_record_details = VALUES(criminal_record_details),
        under_investigation = VALUES(under_investigation),
        disciplinary_action = VALUES(disciplinary_action), disciplinary_action_details = VALUES(disciplinary_action_details)
    `;
    await connection.query(upsertFitnessQuery, [
        userId, heightInCm, weightInKg, formData.age, formData.gender, formData.experience,
        formData.chronicDisease, formData.chronicDiseaseDetails, formData.injury, formData.injuryDetails,
        formData.substances, formData.stress, formData.medications, formData.medicationDetails,
        formData.criminalRecord, formData.criminalRecordDetails, formData.underInvestigation,
        formData.disciplinaryAction, formData.disciplinaryActionDetails
    ]);
    
    // 2. Update the health_status in the main users table
    await connection.query('UPDATE users SET health_status = ? WHERE id = ?', [healthStatus, userId]);

    await connection.commit();

    return NextResponse.json({ message: 'Fitness details saved successfully!' });

  } catch (error) {
    await connection.rollback();
    console.error("Error saving fitness details:", error);
    return NextResponse.json({ message: 'Failed to save details.' }, { status: 500 });
  } finally {
    connection.release();
  }
}