#!/usr/bin/env node

/**
 * List all users in Supabase using the Admin API
 */

import 'dotenv/config'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

async function listUsers() {
  console.log('📋 Fetching users from Supabase...\n')

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('❌ Missing required environment variables')
    process.exit(1)
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'GET',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ Failed to fetch users:')
      console.error(JSON.stringify(data, null, 2))
      process.exit(1)
    }

    if (!data.users || data.users.length === 0) {
      console.log('ℹ️  No users found in the database')
      return
    }

    console.log(`✅ Found ${data.users.length} user(s):\n`)

    data.users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`)
      console.log(`   ID: ${user.id}`)
      console.log(`   Email confirmed: ${user.email_confirmed_at ? '✅' : '❌'}`)
      console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`)
      console.log(`   Last sign in: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'}`)
      console.log()
    })

  } catch (error) {
    console.error('❌ Error fetching users:', error.message)
    process.exit(1)
  }
}

listUsers()
