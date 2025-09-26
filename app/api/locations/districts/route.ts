import { NextResponse, NextRequest } from 'next/server';
import { statesAndDistricts } from '@/lib/locationData';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state');

    if (!state) {
      return NextResponse.json({ message: "State is required" }, { status: 400 });
    }

    const districts = statesAndDistricts[state] || [];

    return NextResponse.json({ districts });

  } catch (error) {
    console.error("Error fetching districts:", error);
    return NextResponse.json({ message: 'Failed to fetch districts.' }, { status: 500 });
  }
}