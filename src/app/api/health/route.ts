import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Test Supabase connection
    const { error: supabaseError } = await supabase
      .from('users')
      .select('count')
      .single();

    const supabaseStatus = supabaseError 
      ? (supabaseError.code === 'PGRST116' ? 'connected (no data)' : 'error')
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
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}