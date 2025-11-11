import { supabase } from '../api/utils/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Database Migration Script
 * 
 * Automatically runs SQL migration files in order
 * 
 * Usage:
 *   node scripts/migrate-database.js
 *   node scripts/migrate-database.js --file=schema.sql
 *   node scripts/migrate-database.js --dry-run
 */

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const specificFile = args.find(arg => arg.startsWith('--file='))?.split('=')[1];

async function runMigration(filePath) {
  const fileName = path.basename(filePath);
  console.log(`\n${'━'.repeat(50)}`);
  console.log(`📄 ${fileName}`);
  console.log('━'.repeat(50));

  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`);
      return false;
    }

    // Read SQL file
    const sql = fs.readFileSync(filePath, 'utf8');
    const lines = sql.split('\n').length;
    const size = (fs.statSync(filePath).size / 1024).toFixed(2);

    console.log(`📊 File info:`);
    console.log(`   Lines: ${lines}`);
    console.log(`   Size: ${size} KB`);

    if (dryRun) {
      console.log('🔍 DRY RUN - Would execute this SQL');
      console.log('\nFirst 10 lines:');
      console.log(sql.split('\n').slice(0, 10).join('\n'));
      console.log('...\n');
      return true;
    }

    // Execute SQL
    console.log('⏳ Executing...');
    
    // Split by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        const { error } = await supabase.rpc('exec_sql', { 
          sql_query: statement + ';' 
        });

        if (error) {
          // Some errors are expected (like "already exists")
          if (error.message.includes('already exists')) {
            console.log(`   ⚠️  Statement ${i + 1}: Already exists (skipped)`);
          } else {
            console.error(`   ❌ Statement ${i + 1}: ${error.message}`);
            errorCount++;
          }
        } else {
          successCount++;
        }
      } catch (err) {
        console.error(`   ❌ Statement ${i + 1}: ${err.message}`);
        errorCount++;
      }
    }

    console.log(`\n📊 Results:`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   ⚠️  Skipped: ${statements.length - successCount - errorCount}`);

    if (errorCount === 0) {
      console.log('✅ Migration successful');
      return true;
    } else {
      console.log('⚠️  Migration completed with errors');
      return false;
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('   Stack:', error.stack);
    return false;
  }
}

async function migrateAll() {
  console.log('🚀 RankSmart Database Migration\n');
  console.log('━'.repeat(50));

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made');
  }

  console.log('━'.repeat(50));

  const projectRoot = path.join(__dirname, '..');

  // Define migration order
  const migrations = [
    'supabase/schema.sql',
    'supabase/week9-schema.sql',
    'supabase/monitoring-schema.sql',
    'supabase/week10-link-optimizer-schema.sql',
    'supabase/week10-stripe-schema.sql',
    'supabase/migrations/003_add_user_domains.sql',
    'supabase/migrations/003_early_access_signups.sql',
    'supabase/migrations/004_analytics_tracking.sql',
    'supabase/migrations/004_auto_update_monitoring.sql',
    'supabase/migrations/004_link_building.sql',
  ];

  // If specific file requested, only run that one
  const filesToRun = specificFile 
    ? [specificFile]
    : migrations;

  let successCount = 0;
  let failCount = 0;

  for (const migration of filesToRun) {
    const fullPath = path.join(projectRoot, migration);
    const success = await runMigration(fullPath);
    
    if (success) {
      successCount++;
    } else {
      failCount++;
      
      // Ask if we should continue
      if (!dryRun && filesToRun.length > 1) {
        console.log('\n⚠️  Migration failed. Continue with next file? (Ctrl+C to abort)');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  console.log('\n' + '━'.repeat(50));
  console.log('📊 MIGRATION SUMMARY');
  console.log('━'.repeat(50));
  console.log(`Total files: ${filesToRun.length}`);
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  
  if (dryRun) {
    console.log('\n🔍 This was a dry run. No changes were made.');
    console.log('Run without --dry-run to apply migrations.');
  } else if (failCount === 0) {
    console.log('\n🎉 All migrations completed successfully!');
  } else {
    console.log('\n⚠️  Some migrations failed. Check errors above.');
  }
  
  console.log('━'.repeat(50) + '\n');

  return failCount === 0;
}

// Run migrations
migrateAll()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
