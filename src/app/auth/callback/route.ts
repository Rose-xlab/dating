import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const cookieStore = cookies()
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}${next}`)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_SITE_URL}/auth/auth-code-error`
  )
}