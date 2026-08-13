import { NextResponse, NextRequest } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseClient';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sport  = searchParams.get('sport')  || '';
    const state  = searchParams.get('state')  || '';
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';
    const page   = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit  = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const offset = (page - 1) * limit;

    const supabase = getSupabaseServerClient();

    let query = supabase
      .from('users')
      .select(`
        *,
        athlete_scores (*),
        user_sports (*)
      `, { count: 'exact' });

    if (state) {
      query = query.eq('state', state);
    }
    if (status) {
      query = query.eq('validation_status', status);
    }
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,username.ilike.%${search}%`);
    }

    const { data: usersData, count, error } = await query.range(offset, offset + limit - 1);

    if (error) {
      console.error('Supabase admin fetch error:', error);
      return NextResponse.json({ message: 'Failed to fetch athlete data.' }, { status: 500 });
    }

    let athletes = (usersData || []).map((u: any, index: number) => {
      const score = u.athlete_scores && u.athlete_scores.length > 0 ? u.athlete_scores[0] : {};
      const userSport = u.user_sports && u.user_sports.length > 0 ? u.user_sports[0] : {};

      // Short readable ID
      const shortId = `ATH${String(index + 1).padStart(3, '0')}`;

      // Calculate approximate age if date_of_birth exists
      let age = null;
      if (u.date_of_birth) {
        const birthDate = new Date(u.date_of_birth);
        const ageDifMs = Date.now() - birthDate.getTime();
        const ageDate = new Date(ageDifMs);
        age = Math.abs(ageDate.getUTCFullYear() - 1970);
      }

      return {
        id: shortId,
        userId: u.id,
        fullName: u.full_name,
        sport: userSport.sport_name || 'N/A',
        state: u.state || 'N/A',
        district: u.district || 'N/A',
        registrationDate: u.registered_at ? u.registered_at.split('T')[0] : '',
        validationStatus: u.validation_status || 'Pending',
        excellenceScore: score.excellence_score || 0,
        fitnessScore: score.fitness_score || 0,
        videoAnalysisScore: score.video_analysis_score || 0,
        overallScore: score.overall_score || 0,
        tier: score.tier || 'Beginner',
        age: age,
        phone: u.phone || '',
        email: u.gmail || '',
        healthStatus: u.health_status || 'Cleared',
        techniqueScore: score.technique_score || 0,
        performanceScore: score.performance_score || 0,
        analysisTimestamp: score.analysis_timestamp || null,
        modelVersion: score.model_version || '1.0.0',
        videoMetricsJson: score.video_metrics_json || null,
      };
    });

    // Filter by sport client side if requested
    if (sport) {
      athletes = athletes.filter((a: any) => a.sport.toLowerCase() === sport.toLowerCase());
    }

    // Sort by overallScore descending
    athletes.sort((a: any, b: any) => b.overallScore - a.overallScore);

    const total = count || athletes.length;

    return NextResponse.json({
      athletes,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Failed to fetch athlete data:', error);
    return NextResponse.json({ message: 'Failed to fetch athlete data.' }, { status: 500 });
  }
}
