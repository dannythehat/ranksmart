import { supabase } from '../api/utils/db.js';

/**
 * Test Supabase Database Connection
 * 
 * This script verifies:
 * 1. Basic connection to Supabase
 * 2. Ability to query tables
 * 3. List all available tables
 */

async function testConnection() {
  console.log('🧪 Testing Supabase Connection...\n');
  console.log('━'.repeat(50));

  try {
    // Test 1: Basic connection
    console.log('\n1️⃣ Testing basic connection...');
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Connection failed:', error.message);
      console.error('   Code:', error.code);
      console.error('   Details:', error.details);
      return false;
    }

    console.log('✅ Database connection successful');

    // Test 2: List all tables
    console.log('\n2️⃣ Fetching available tables...');
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_tables');

    if (tablesError) {
      // Fallback: Try to query information_schema
      console.log('   Using fallback method...');
      const { data: fallbackTables } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .order('table_name');

      if (fallbackTables && fallbackTables.length > 0) {
        console.log('\n📊 Available Tables:');
        fallbackTables.forEach(t => console.log(`   ✓ ${t.table_name}`));
        console.log(`\n   Total: ${fallbackTables.length} tables`);
      } else {
        console.log('⚠️  Could not fetch table list');
      }
    } else {
      console.log('\n📊 Available Tables:');
      tables?.forEach(t => console.log(`   ✓ ${t.table_name}`));
      console.log(`\n   Total: ${tables?.length || 0} tables`);
    }

    // Test 3: Check environment variables
    console.log('\n3️⃣ Checking environment configuration...');
    const hasUrl = !!process.env.SUPABASE_URL;
    const hasKey = !!process.env.SUPABASE_SERVICE_KEY;
    
    console.log(`   SUPABASE_URL: ${hasUrl ? '✅ Set' : '❌ Missing'}`);
    console.log(`   SUPABASE_SERVICE_KEY: ${hasKey ? '✅ Set' : '❌ Missing'}`);

    if (hasUrl) {
      console.log(`   URL: ${process.env.SUPABASE_URL}`);
    }

    console.log('\n━'.repeat(50));
    console.log('🎉 Connection test completed successfully!\n');
    return true;

  } catch (error) {
    console.error('\n❌ Connection test failed:', error.message);
    console.error('   Stack:', error.stack);
    console.log('\n━'.repeat(50));
    console.log('❌ Connection test failed\n');
    return false;
  }
}

// Run the test
testConnection()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
