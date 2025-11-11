# 🗄️ Day 3: Database Integration (Part 1) - Complete Setup

**Date**: November 11, 2025  
**Status**: 🔄 In Progress  
**Estimated Time**: 4-6 hours

---

## 🎯 Objective

Deploy all database schemas to Supabase and ensure complete database integration with the application. Test all CRUD operations and verify data persistence.

---

## 📋 Pre-Flight Checklist

### Environment Setup
- [ ] Verify Supabase credentials in `.env`
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_KEY`
- [ ] Test Supabase connection
- [ ] Verify `api/utils/db.js` is accessible

---

## 🗂️ Database Schema Overview

### Core Schemas Identified:

1. **`schema.sql`** - Main schema (217 lines)
   - `profiles` table
   - `audits` table
   - `optimizations` table
   - `images` table
   - `api_keys` table
   - `webhooks` table
   - RLS policies
   - Triggers and functions

2. **`week9-schema.sql`** - Enterprise features (302 lines)
   - `teams` table
   - `team_members` table
   - `team_invitations` table
   - Enhanced `api_keys` table
   - `api_usage_logs` table
   - Analytics views

3. **`monitoring-schema.sql`** - Mode 3 monitoring (144 lines)
   - `monitored_content` table
   - `content_changes` table
   - `monitoring_rules` table
   - `bulk_updates` table

4. **`week10-link-optimizer-schema.sql`** - Link building
5. **`week10-stripe-schema.sql`** - Payment system

### Migration Files:
- `003_add_user_domains.sql`
- `003_early_access_signups.sql`
- `004_analytics_tracking.sql`
- `004_auto_update_monitoring.sql`
- `004_link_building.sql`

---

## ✅ Task 1: Review Existing Schemas

### Action Items:
1. [ ] Read through `supabase/schema.sql`
2. [ ] Read through `supabase/week9-schema.sql`
3. [ ] Read through `supabase/monitoring-schema.sql`
4. [ ] Check for schema conflicts or duplicates
5. [ ] Document table relationships

### Expected Tables:
```
Core Tables:
├── profiles (user data)
├── audits (scan results)
├── optimizations (Mode 1 & 2 results)
├── images (AI-generated images)
├── api_keys (API authentication)
└── webhooks (integrations)

Enterprise Tables:
├── teams (team management)
├── team_members (team users)
├── team_invitations (pending invites)
└── api_usage_logs (API tracking)

Monitoring Tables:
├── monitored_content (tracked URLs)
├── content_changes (change history)
├── monitoring_rules (custom rules)
└── bulk_updates (batch operations)
```

---

## ✅ Task 2: Deploy Schemas to Supabase

### Method 1: Supabase Dashboard (Recommended)
1. [ ] Login to Supabase Dashboard
2. [ ] Navigate to SQL Editor
3. [ ] Run schemas in order:
   ```
   1. schema.sql (base tables)
   2. week9-schema.sql (enterprise)
   3. monitoring-schema.sql (monitoring)
   4. migrations/*.sql (enhancements)
   ```
4. [ ] Verify each schema runs without errors
5. [ ] Check tables are created in Table Editor

### Method 2: Supabase CLI (Alternative)
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref YOUR_PROJECT_REF

# Run migrations
supabase db push
```

### Verification:
- [ ] All tables visible in Supabase Dashboard
- [ ] RLS policies enabled
- [ ] Indexes created
- [ ] Triggers active
- [ ] Functions deployed

---

## ✅ Task 3: Test Database Connection

### Create Test Script: `tests/test-db-connection.js`

```javascript
import { supabase } from '../api/utils/db.js';

async function testConnection() {
  console.log('🧪 Testing Supabase Connection...\n');

  try {
    // Test 1: Basic connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error) throw error;
    console.log('✅ Database connection successful');

    // Test 2: List all tables
    const { data: tables } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    console.log('\n📊 Available Tables:');
    tables?.forEach(t => console.log(`  - ${t.table_name}`));

    return true;
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    return false;
  }
}

testConnection();
```

### Run Test:
```bash
node tests/test-db-connection.js
```

### Expected Output:
```
✅ Database connection successful

📊 Available Tables:
  - profiles
  - audits
  - optimizations
  - images
  - api_keys
  - webhooks
  - teams
  - team_members
  - monitored_content
  - content_changes
  ...
```

---

## ✅ Task 4: Test CRUD Operations

### Create Test Script: `tests/test-crud-operations.js`

```javascript
import { 
  saveAudit, 
  getUserAudits, 
  getAudit,
  getUserProfile,
  updateUserProfile 
} from '../api/utils/db.js';

async function testCRUD() {
  console.log('🧪 Testing CRUD Operations...\n');

  // You'll need a test user ID from Supabase Auth
  const testUserId = 'YOUR_TEST_USER_ID';

  try {
    // Test 1: Create audit
    console.log('1️⃣ Testing saveAudit...');
    const auditData = {
      url: 'https://example.com',
      title: 'Test Page',
      overall_score: 85,
      analysis: { test: true },
      page_data: {},
      serp_data: {}
    };

    const { data: savedAudit, error: saveError } = await saveAudit(testUserId, auditData);
    if (saveError) throw new Error(`Save failed: ${saveError}`);
    console.log('✅ Audit saved:', savedAudit.id);

    // Test 2: Read audits
    console.log('\n2️⃣ Testing getUserAudits...');
    const { data: audits, error: getError } = await getUserAudits(testUserId, 5);
    if (getError) throw new Error(`Get failed: ${getError}`);
    console.log(`✅ Retrieved ${audits.length} audits`);

    // Test 3: Read single audit
    console.log('\n3️⃣ Testing getAudit...');
    const { data: singleAudit, error: getSingleError } = await getAudit(savedAudit.id, testUserId);
    if (getSingleError) throw new Error(`Get single failed: ${getSingleError}`);
    console.log('✅ Retrieved audit:', singleAudit.url);

    // Test 4: Update profile
    console.log('\n4️⃣ Testing updateUserProfile...');
    const { data: profile, error: updateError } = await updateUserProfile(testUserId, {
      full_name: 'Test User Updated'
    });
    if (updateError) throw new Error(`Update failed: ${updateError}`);
    console.log('✅ Profile updated');

    // Test 5: Get profile
    console.log('\n5️⃣ Testing getUserProfile...');
    const { data: userProfile, error: getProfileError } = await getUserProfile(testUserId);
    if (getProfileError) throw new Error(`Get profile failed: ${getProfileError}`);
    console.log('✅ Profile retrieved:', userProfile.email);

    console.log('\n🎉 All CRUD tests passed!');
    return true;

  } catch (error) {
    console.error('\n❌ CRUD test failed:', error.message);
    return false;
  }
}

testCRUD();
```

---

## ✅ Task 5: Add Database Error Handling

### Update `api/utils/db.js`:

Add comprehensive error handling wrapper:

```javascript
// Add at top of db.js
export function handleDatabaseError(error, operation) {
  console.error(`Database ${operation} error:`, error);
  
  // Parse Supabase errors
  if (error.code === 'PGRST116') {
    return { error: 'Record not found', code: 404 };
  }
  
  if (error.code === '23505') {
    return { error: 'Duplicate entry', code: 409 };
  }
  
  if (error.code === '23503') {
    return { error: 'Referenced record not found', code: 400 };
  }
  
  if (error.message?.includes('JWT')) {
    return { error: 'Authentication failed', code: 401 };
  }
  
  return { error: error.message || 'Database operation failed', code: 500 };
}
```

Update all functions to use error handler:

```javascript
export async function saveAudit(userId, auditData) {
  try {
    const { data, error } = await supabase
      .from('audits')
      .insert({...})
      .select()
      .single();

    if (error) return handleDatabaseError(error, 'saveAudit');
    return { data, error: null };
  } catch (error) {
    return handleDatabaseError(error, 'saveAudit');
  }
}
```

---

## ✅ Task 6: Create Migration Scripts

### Create `scripts/migrate-database.js`:

```javascript
import { supabase } from '../api/utils/db.js';
import fs from 'fs';
import path from 'path';

async function runMigration(filePath) {
  console.log(`\n📄 Running: ${path.basename(filePath)}`);
  
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) throw error;
    console.log('✅ Migration successful');
    return true;
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    return false;
  }
}

async function migrateAll() {
  console.log('🚀 Starting database migration...\n');
  
  const migrations = [
    'supabase/schema.sql',
    'supabase/week9-schema.sql',
    'supabase/monitoring-schema.sql',
    'supabase/migrations/003_add_user_domains.sql',
    'supabase/migrations/004_analytics_tracking.sql',
  ];
  
  for (const migration of migrations) {
    const success = await runMigration(migration);
    if (!success) {
      console.error('\n❌ Migration stopped due to error');
      process.exit(1);
    }
  }
  
  console.log('\n🎉 All migrations completed successfully!');
}

migrateAll();
```

---

## ✅ Task 7: Document Database Structure

### Create `docs/DATABASE.md`:

```markdown
# RankSmart Database Structure

## Core Tables

### profiles
User account information and settings
- Primary key: `id` (UUID, references auth.users)
- Stores: email, plan, scan quotas, domains

### audits
SEO audit results
- Primary key: `id` (UUID)
- Foreign key: `user_id` → profiles
- Stores: URL, score, analysis data, SERP data

### optimizations
Content optimization results (Mode 1 & 2)
- Primary key: `id` (UUID)
- Foreign keys: `audit_id` → audits, `user_id` → profiles
- Stores: original/optimized content, improvements

## Relationships

```
auth.users (Supabase Auth)
    ↓
profiles (1:1)
    ↓
    ├── audits (1:many)
    │     ↓
    │     └── optimizations (1:many)
    │
    ├── monitored_content (1:many)
    │     ↓
    │     └── content_changes (1:many)
    │
    └── teams (1:many)
          ↓
          └── team_members (1:many)
```

## Security

All tables have Row Level Security (RLS) enabled:
- Users can only access their own data
- Team members can access team data
- Service role bypasses RLS for admin operations
```

---

## 🧪 Testing Checklist

### Manual Tests:
- [ ] Create test user via signup
- [ ] Verify profile auto-created
- [ ] Run audit and save result
- [ ] Retrieve audit history
- [ ] Update user profile
- [ ] Test quota checking
- [ ] Test domain management
- [ ] Verify RLS policies work

### Automated Tests:
- [ ] Connection test passes
- [ ] CRUD operations test passes
- [ ] Error handling test passes
- [ ] Migration script runs successfully

---

## 📊 Success Criteria

✅ **Day 3 Complete When:**
1. All schemas deployed to Supabase
2. All tables visible and accessible
3. Database connection test passes
4. CRUD operations work correctly
5. Error handling implemented
6. Migration scripts created
7. Database documented
8. All manual tests pass

---

## 🐛 Common Issues & Solutions

### Issue: "relation does not exist"
**Solution**: Schema not deployed. Run migrations in SQL Editor.

### Issue: "JWT expired"
**Solution**: Token expired. Re-authenticate user.

### Issue: "permission denied for table"
**Solution**: RLS policy blocking access. Check user_id matches.

### Issue: "duplicate key value"
**Solution**: Unique constraint violated. Check for existing records.

---

## 📝 Next Steps (Day 4)

Once Day 3 is complete:
1. Integrate database with audit system
2. Save audit results automatically
3. Display audit history on dashboard
4. Add data export functionality

---

## 📚 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
