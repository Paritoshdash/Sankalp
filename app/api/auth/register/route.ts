import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseClient';

export async function POST(request: Request) {
  try {
    const { 
      fullName, username, gmail, aadhaar, phone, 
      password, state, district, city, pincode 
    } = await request.json();

    if (!fullName || !username || !aadhaar || !phone || !password) {
      return NextResponse.json({ message: "Required fields must be filled" }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();

    // Check if user already exists in public.users
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, username, aadhaar')
      .or(`username.eq.${username},aadhaar.eq.${aadhaar}`)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { message: 'A user with this Username or Aadhaar already exists' },
        { status: 409 }
      );
    }

    // Determine email for Supabase Auth
    const email = gmail && gmail.trim() ? gmail.trim() : `${username.toLowerCase()}@sankalp.app`;

    // 1. Sign up user via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          username: username,
          aadhaar: aadhaar,
          phone: phone,
        },
      },
    });

    if (authError || !authData.user) {
      console.error('Supabase auth signup error:', authError);
      return NextResponse.json(
        { message: authError?.message || 'Failed to create auth account' },
        { status: 500 }
      );
    }

    const userId = authData.user.id;

    // 2. Insert into public.users
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: userId,
        full_name: fullName,
        username: username,
        gmail: email,
        aadhaar: aadhaar,
        phone: phone,
        state: state || null,
        district: district || null,
        city: city || null,
        pincode: pincode || null,
      });

    if (profileError) {
      console.error('Profile insert error:', profileError);
      return NextResponse.json(
        { message: 'Failed to create user profile' },
        { status: 500 }
      );
    }

    // 3. Initialize default athlete scores entry
    await supabase.from('athlete_scores').insert({
      user_id: userId,
      excellence_score: 0,
      fitness_score: 0,
      video_analysis_score: 0,
      overall_score: 0,
      tier: 'Beginner',
    });

    return NextResponse.json(
      { message: 'User registered successfully!', user: { id: userId, username, email } },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Registration exception:', error);
    return NextResponse.json({ message: 'An error occurred during registration' }, { status: 500 });
  }
}