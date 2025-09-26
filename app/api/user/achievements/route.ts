import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const certificateFile: File | null = data.get('certificate') as unknown as File;
    const level = data.get('level') as string;
    const experience = data.get('experience') as string;
    const userId = data.get('userId') as string;

    if (!certificateFile || !level || !userId) {
      return NextResponse.json({ message: "Missing required fields." }, { status: 400 });
    }
    
    // --- File Handling ---
    // 1. Convert file data to a buffer
    const bytes = await certificateFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 2. Create a unique filename and path
    const uniqueFilename = `${Date.now()}_${certificateFile.name}`;
    const relativeUploadDir = '/uploads/certificates';
    const uploadDir = path.join(process.cwd(), 'public', relativeUploadDir);
    const filePath = path.join(uploadDir, uniqueFilename);
    
    // 3. Save the file to the server
    await writeFile(filePath, buffer);
    const fileUrl = path.join(relativeUploadDir, uniqueFilename).replace(/\\/g, "/");

    // --- Database Interaction ---
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Insert the achievement record
      await connection.query(
        'INSERT INTO achievements (user_id, level, experience, certificate_url) VALUES (?, ?, ?, ?)',
        [userId, level, experience, fileUrl]
      );
      
      // 2. Update the user's record to indicate they have achievements
      await connection.query(
        'UPDATE users SET has_achievements = TRUE WHERE id = ?',
        [userId]
      );

      await connection.commit();
      
      return NextResponse.json({ message: 'Achievement saved successfully!' });

    } catch (error) {
      await connection.rollback();
      throw error; // Re-throw to be caught by the outer catch block
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error("Error saving achievement:", error);
    return NextResponse.json({ message: 'Failed to save achievement.' }, { status: 500 });
  }
}