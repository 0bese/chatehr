import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    return NextResponse.json({
      id: user.id,
      practitionerId: user.practitionerId,
      practitionerName: user.practitionerName,
      patientId: user.patientId,
      patientName: user.patientName,
      fhirBaseUrl: user.fhirBaseUrl,
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}