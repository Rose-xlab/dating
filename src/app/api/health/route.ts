import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Test Supabase connection
    const { error: supabaseError } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true });

    const supabaseStatus = supabaseError 
      ? 'error'
      : 'connected';

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        supabase: supabaseStatus,
        api: 'running'
      },
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'An unknown error occurred',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}