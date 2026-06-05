import { NextResponse } from 'next/server'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const checks = {
    supabase_url: !!supabaseUrl && !supabaseUrl.includes('your-project'),
    supabase_anon_key: !!supabaseAnonKey && !supabaseAnonKey.includes('your-anon'),
    supabase_url_value: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'MISSING',
  }

  const ok = checks.supabase_url && checks.supabase_anon_key

  return NextResponse.json({ ok, checks }, { status: ok ? 200 : 500 })
}
