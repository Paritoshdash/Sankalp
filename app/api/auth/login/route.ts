import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseClient';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ message: "Username and password are required" }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();

    // Find user profile by username or email
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('*')
      .or(`username.eq.${username},gmail.eq.${username}`)
      .maybeSingle();

    if (userError || !userProfile) {
      return NextResponse.json({ message: 'Invalid credentials. User not found.' }, { status: 401 });
    }

    const targetEmail = userProfile.gmail || `${userProfile.username.toLowerCase()}@sankalp.app`;

    // Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: targetEmail,
      password: password,
    });

    if (authError || !authData.session) {
      return NextResponse.json({ message: authError?.message || 'Incorrect password. Please try again.' }, { status: 401 });
    }

    return NextResponse.json({
      message: 'Login successful',
      user: userProfile,
      session: authData.session,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'An error occurred during login' }, { status: 500 });
  }
}