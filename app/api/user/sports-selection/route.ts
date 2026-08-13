import { NextResponse, NextRequest } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseClient';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ message: "User ID is required" }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const { data: selection, error } = await supabase
      .from('user_sports')
      .select('sport_name, skill_level, sport_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching sport selection:", error);
    }

    return NextResponse.json({ selection: selection || null });

  } catch (error) {
    console.error("Error fetching sport selection:", error);
    return NextResponse.json({ message: 'Failed to fetch sport selection.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId, sportName, sportCategory, skillLevel, sportId } = await request.json();

    if (!userId || !sportName || !sportCategory || !skillLevel || !sportId) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();

    const { error } = await supabase
      .from('user_sports')
      .upsert({
        user_id: userId,
        sport_name: sportName,
        sport_category: sportCategory,
        skill_level: skillLevel,
        sport_id: sportId,
      }, { onConflict: 'user_id' });

    if (error) {
      console.error("Error saving sport selection:", error);
      return NextResponse.json({ message: 'Failed to save sport selection.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Sport selection saved successfully!' });

  } catch (error: any) {
    console.error("Error saving sport selection:", error);
    return NextResponse.json({ message: 'Failed to save sport selection.' }, { status: 500 });
  }
}