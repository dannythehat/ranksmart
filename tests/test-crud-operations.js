import { 
  saveAudit, 
  getUserAudits, 
  getAudit,
  getUserProfile,
  updateUserProfile,
  checkScanQuota,
  incrementScanCount
} from '../api/utils/db.js';

/**
 * Test Database CRUD Operations
 * 
 * This script tests:
 * 1. Create - Save audit
 * 2. Read - Get audits and profile
 * 3. Update - Update profile
 * 4. Quota management
 * 
 * IMPORTANT: You need a valid test user ID from Supabase Auth
 * Get one by signing up through the app first
 */

// ⚠️ REPLACE THIS WITH YOUR TEST USER ID
const TEST_USER_ID = process.env.TEST_USER_ID || 'YOUR_TEST_USER_ID_HERE';

async function testCRUD() {
  console.log('🧪 Testing CRUD Operations...\n');
  console.log('━'.repeat(50));

  if (TEST_USER_ID === 'YOUR_TEST_USER_ID_HERE') {
    console.error('❌ Please set TEST_USER_ID environment variable');
    console.log('\nHow to get a test user ID:');
    console.log('1. Sign up through the app');
    console.log('2. Check Supabase Dashboard > Authentication > Users');
    console.log('3. Copy the user ID');
    console.log('4. Set: export TEST_USER_ID="your-user-id"');
    console.log('5. Run this test again\n');
    return false;
  }

  console.log(`Using test user: ${TEST_USER_ID}\n`);

  try {
    // Test 1: Get user profile
    console.log('1️⃣ Testing getUserProfile...');
    const { data: profile, error: profileError } = await getUserProfile(TEST_USER_ID);
    
    if (profileError) {
      console.error('❌ Get profile failed:', profileError);
      console.log('   This might mean the user doesn\'t exist or profile wasn\'t created');
      return false;
    }
    
    console.log('✅ Profile retrieved');
    console.log(`   Email: ${profile.email}`);
    console.log(`   Plan: ${profile.plan}`);
    console.log(`   Scans: ${profile.scans_used}/${profile.scans_limit}`);

    // Test 2: Check quota
    console.log('\n2️⃣ Testing checkScanQuota...');
    const quota = await checkScanQuota(TEST_USER_ID);
    
    if (quota.error) {
      console.error('❌ Check quota failed:', quota.error);
      return false;
    }
    
    console.log('✅ Quota checked');
    console.log(`   Has quota: ${quota.hasQuota}`);
    console.log(`   Used: ${quota.scansUsed}`);
    console.log(`   Limit: ${quota.scansLimit}`);
    console.log(`   Remaining: ${quota.scansRemaining}`);

    // Test 3: Create audit
    console.log('\n3️⃣ Testing saveAudit...');
    const auditData = {
      url: 'https://example.com/test-' + Date.now(),
      title: 'Test Page - CRUD Test',
      overall_score: 85,
      analysis: {
        test: true,
        timestamp: new Date().toISOString(),
        categories: {
          eeat: 85,
          technical: 90,
          content: 80
        }
      },
      page_data: {
        wordCount: 1500,
        headings: ['H1', 'H2', 'H2', 'H3'],
        images: 5
      },
      serp_data: {
        position: 3,
        competitors: 10
      }
    };

    const { data: savedAudit, error: saveError } = await saveAudit(TEST_USER_ID, auditData);
    
    if (saveError) {
      console.error('❌ Save audit failed:', saveError);
      return false;
    }
    
    console.log('✅ Audit saved');
    console.log(`   ID: ${savedAudit.id}`);
    console.log(`   URL: ${savedAudit.url}`);
    console.log(`   Score: ${savedAudit.overall_score}`);

    // Test 4: Read audits (list)
    console.log('\n4️⃣ Testing getUserAudits...');
    const { data: audits, error: getError } = await getUserAudits(TEST_USER_ID, 5);
    
    if (getError) {
      console.error('❌ Get audits failed:', getError);
      return false;
    }
    
    console.log(`✅ Retrieved ${audits.length} audits`);
    audits.forEach((audit, i) => {
      console.log(`   ${i + 1}. ${audit.url} (Score: ${audit.overall_score})`);
    });

    // Test 5: Read single audit
    console.log('\n5️⃣ Testing getAudit...');
    const { data: singleAudit, error: getSingleError } = await getAudit(
      savedAudit.id, 
      TEST_USER_ID
    );
    
    if (getSingleError) {
      console.error('❌ Get single audit failed:', getSingleError);
      return false;
    }
    
    console.log('✅ Single audit retrieved');
    console.log(`   URL: ${singleAudit.url}`);
    console.log(`   Title: ${singleAudit.title}`);
    console.log(`   Created: ${new Date(singleAudit.created_at).toLocaleString()}`);

    // Test 6: Update profile
    console.log('\n6️⃣ Testing updateUserProfile...');
    const { data: updatedProfile, error: updateError } = await updateUserProfile(
      TEST_USER_ID, 
      {
        full_name: 'Test User - Updated ' + Date.now()
      }
    );
    
    if (updateError) {
      console.error('❌ Update profile failed:', updateError);
      return false;
    }
    
    console.log('✅ Profile updated');
    console.log(`   Name: ${updatedProfile.full_name}`);

    // Test 7: Increment scan count
    console.log('\n7️⃣ Testing incrementScanCount...');
    const { success: incrementSuccess, error: incrementError } = await incrementScanCount(TEST_USER_ID);
    
    if (incrementError) {
      console.error('❌ Increment scan failed:', incrementError);
      return false;
    }
    
    console.log('✅ Scan count incremented');

    // Verify increment
    const { data: updatedQuota } = await checkScanQuota(TEST_USER_ID);
    console.log(`   New count: ${updatedQuota.scansUsed}`);

    console.log('\n━'.repeat(50));
    console.log('🎉 All CRUD tests passed!\n');
    return true;

  } catch (error) {
    console.error('\n❌ CRUD test failed:', error.message);
    console.error('   Stack:', error.stack);
    console.log('\n━'.repeat(50));
    console.log('❌ CRUD test failed\n');
    return false;
  }
}

// Run the test
testCRUD()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
