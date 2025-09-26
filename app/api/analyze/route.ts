import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const videoFile = formData.get('video') as File;
    const sport = formData.get('sport') as string;
    const userId = formData.get('userId') as string;

    if (!videoFile || !sport) {
      return NextResponse.json({ message: 'Missing video file or sport' }, { status: 400 });
    }
    
    // In a real application, you would first upload the video to a storage service
    // like AWS S3, and then send the URL to your Python backend.
    // For simplicity, we'll forward the file directly.

    const pythonBackendUrl = 'http://127.0.0.1:8000/analyze'; // Your Python FastAPI server URL

    // Create a new FormData to send to the Python backend
    const backendFormData = new FormData();
    backendFormData.append('video', videoFile);
    backendFormData.append('sport', sport);

    const pythonResponse = await fetch(pythonBackendUrl, {
      method: 'POST',
      body: backendFormData,
    });

    if (!pythonResponse.ok) {
      const errorData = await pythonResponse.text();
      console.error('Python backend error:', errorData);
      return NextResponse.json({ message: 'Analysis failed on the backend' }, { status: 500 });
    }
    
    const analysisData = await pythonResponse.json();

    // Here you would save the analysisData to your database, linked to the userId

    return NextResponse.json({ message: 'Analysis successful', data: analysisData });

  } catch (error) {
    console.error('API analyze error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}