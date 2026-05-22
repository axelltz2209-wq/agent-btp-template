#!/usr/bin/env node

/**
 * Create a test user in Supabase using the Admin API
 * This script uses the service role key which bypasses RLS
 */

import 'dotenv/config'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const TEST_USER = {
  email: 'admin@agent-btp.fr',
  password: 'AgentBTP2026!',
  email_confirm: true, // Auto-confirm the email
}

async function createTestUser() {
  console.log('🚀 Creating test user in Supabase...\n')

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('❌ Missing required environment variables:')
    console.error('   - SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌')
    console.error('   - SUPABASE_SERVICE_ROLE_KEY:', SERVICE_ROLE_KEY ? '✅' : '❌')
    console.error('\nPlease check your .env file.')
    process.exit(1)
  }

  try {
    // Create user using Supabase Admin API
    const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify(TEST_USER),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ Failed to create user:')
      console.error(JSON.stringify(data, null, 2))

      if (data.code === '23505' || data.message?.includes('already registered')) {
        console.log('\n⚠️  User already exists. Listing existing users...\n')
        await listUsers()
      }

      process.exit(1)
    }

    console.log('✅ Test user created successfully!\n')
    console.log('User details:')
    console.log('  Email:', data.email)
    console.log('  ID:', data.id)
    console.log('  Email confirmed:', data.email_confirmed_at ? '✅' : '❌')
    console.log('  Created at:', data.created_at)
    console.log('\n📝 Login credentials:')
    console.log('  Email:', TEST_USER.email)
    console.log('  Password:', TEST_USER.password)
    console.log('\n🌐 You can now log in at: http://localhost:3000/login')

  } catch (error) {
    console.error('❌ Error creating user:', error.message)
    process.exit(1)
  }
}

async function listUsers() {
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'GET',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
    })

    const data = await response.json()

    if (response.ok && data.users) {
      console.log('📋 Existing users:')
      data.users.forEach((user) => {
        console.log(`  - ${user.email} (ID: ${user.id})`)
      })
    }
  } catch (error) {
    console.error('Error listing users:', error.message)
  }
}

// Run the script
createTestUser()
