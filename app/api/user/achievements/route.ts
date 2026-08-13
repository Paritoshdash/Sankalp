import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseClient';
import { writeFile, mkdir } from 'fs/promises';
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

    const bytes = await certificateFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uniqueFilename = `${Date.now()}_${certificateFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const relativeUploadDir = '/uploads/certificates';
    const uploadDir = path.join(process.cwd(), 'public', relativeUploadDir);
    
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (_) {}

    const filePath = path.join(uploadDir, uniqueFilename);
    await writeFile(filePath, buffer);
    const fileUrl = path.join(relativeUploadDir, uniqueFilename).replace(/\\/g, "/");

    const supabase = getSupabaseServerClient();

    // 1. Insert achievement
    const { error: achError } = await supabase
      .from('achievements')
      .insert({
        user_id: userId,
        level: level,
        experience: experience || '',
        certificate_url: fileUrl,
      });

    if (achError) {
      console.error('Achievement insert error:', achError);
      return NextResponse.json({ message: 'Failed to save achievement.' }, { status: 500 });
    }

    // 2. Update user has_achievements flag
    await supabase.from('users').update({ has_achievements: true }).eq('id', userId);

    return NextResponse.json({ message: 'Achievement saved successfully!', fileUrl });

  } catch (error) {
    console.error("Error saving achievement:", error);
    return NextResponse.json({ message: 'Failed to save achievement.' }, { status: 500 });
  }
}