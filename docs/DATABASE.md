# 🗄️ RankSmart Database Documentation

**Database**: PostgreSQL (via Supabase)  
**Version**: 15.x  
**Last Updated**: November 11, 2025

---

## 📊 Overview

RankSmart uses Supabase (PostgreSQL) for all data persistence. The database is organized into three main schema groups:

1. **Core Schema** - Essential tables for basic functionality
2. **Enterprise Schema** - Team management and API features
3. **Monitoring Schema** - Content monitoring and change tracking

---

## 🗂️ Core Tables

### `profiles`
User account information and settings

**Columns:**
- `id` (UUID, PK) - References `auth.users(id)`
- `email` (TEXT, UNIQUE) - User email
- `full_name` (TEXT) - Display name
- `plan` (TEXT) - Subscription plan: `starter`, `professional`, `enterprise`
- `scans_used` (INTEGER) - Number of scans performed
- `scans_limit` (INTEGER) - Maximum scans allowed
- `domains` (TEXT[]) - User's owned domains for internal link detection
- `created_at` (TIMESTAMPTZ) - Account creation date
- `updated_at` (TIMESTAMPTZ) - Last profile update

**Indexes:**
- Primary key on `id`
- Unique index on `email`

**RLS Policies:**
- Users can view/update their own profile only

**Triggers:**
- Auto-creates profile when user signs up
- Auto-updates `updated_at` on changes

---

### `audits`
SEO audit results and analysis data

**Columns:**
- `id` (UUID, PK) - Unique audit identifier
- `user_id` (UUID, FK) - References `profiles(id)`
- `url` (TEXT) - Audited URL
- `title` (TEXT) - Page title
- `overall_score` (INTEGER) - Score 0-100
- `analysis` (JSONB) - Detailed analysis results
- `page_data` (JSONB) - Scraped page content
- `serp_data` (JSONB) - SERP analysis results
- `created_at` (TIMESTAMPTZ) - Audit timestamp
- `updated_at` (TIMESTAMPTZ) - Last update

**Indexes:**
- Primary key on `id`
- Index on `user_id`
- Index on `created_at DESC`
- Index on `url`
- Index on `score`

**RLS Policies:**
- Users can view/create/update/delete their own audits

**Sample Data:**
```json
{
  "analysis": {
    "eeat_score": 85,
    "technical_score": 90,
    "content_score": 80,
    "issues": [...],
    "recommendations": [...]
  },
  "page_data": {
    "word_count": 1500,
    "headings": ["H1", "H2", ...],
    "images": 5,
    "links": {...}
  }
}
```

---

### `optimizations`
Content optimization results (Mode 1 & 2)

**Columns:**
- `id` (UUID, PK) - Unique optimization ID
- `audit_id` (UUID, FK) - References `audits(id)`
- `user_id` (UUID, FK) - References `profiles(id)`
- `mode` (TEXT) - `fix` or `rewrite`
- `original_content` (JSONB) - Original content
- `optimized_content` (JSONB) - AI-optimized content
- `improvements` (JSONB) - List of improvements made
- `estimated_score` (INTEGER) - Predicted score after optimization
- `created_at` (TIMESTAMPTZ) - Optimization timestamp

**Indexes:**
- Primary key on `id`
- Index on `audit_id`
- Index on `user_id`

**RLS Policies:**
- Users can view/create their own optimizations

---

### `images`
AI-generated images for content

**Columns:**
- `id` (UUID, PK) - Unique image ID
- `optimization_id` (UUID, FK) - References `optimizations(id)`
- `user_id` (UUID, FK) - References `profiles(id)`
- `prompt` (TEXT) - AI generation prompt
- `url` (TEXT) - Image URL
- `alt_text` (TEXT) - SEO alt text
- `placement` (TEXT) - Where to place image
- `created_at` (TIMESTAMPTZ) - Generation timestamp

**Indexes:**
- Primary key on `id`
- Index on `optimization_id`

**RLS Policies:**
- Users can view/create their own images

---

### `api_keys`
API authentication keys

**Columns:**
- `id` (UUID, PK) - Unique key ID
- `user_id` (UUID, FK) - References `profiles(id)`
- `name` (TEXT) - Key name/description
- `key_hash` (TEXT, UNIQUE) - SHA-256 hash of key
- `key_prefix` (TEXT) - First 8 chars for identification
- `scopes` (TEXT[]) - Permissions: `read`, `write`, `admin`
- `last_used_at` (TIMESTAMPTZ) - Last usage timestamp
- `usage_count` (INTEGER) - Total API calls
- `status` (TEXT) - `active`, `revoked`, `expired`
- `expires_at` (TIMESTAMPTZ) - Expiration date
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update

**Indexes:**
- Primary key on `id`
- Index on `user_id`
- Index on `key_hash`
- Index on `status`

**RLS Policies:**
- Users can manage their own API keys

---

### `webhooks`
Webhook integrations

**Columns:**
- `id` (UUID, PK) - Unique webhook ID
- `user_id` (UUID, FK) - References `profiles(id)`
- `url` (TEXT) - Webhook endpoint URL
- `events` (TEXT[]) - Events to trigger on
- `secret` (TEXT) - Webhook signing secret
- `active` (BOOLEAN) - Enabled/disabled
- `created_at` (TIMESTAMPTZ) - Creation timestamp

**Indexes:**
- Primary key on `id`
- Index on `user_id`

**RLS Policies:**
- Users can manage their own webhooks

---

## 👥 Enterprise Tables

### `teams`
Team/organization management

**Columns:**
- `id` (UUID, PK) - Unique team ID
- `name` (TEXT) - Team name
- `owner_id` (UUID, FK) - References `auth.users(id)`
- `plan` (TEXT) - Team plan level
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update

**RLS Policies:**
- Team owners and members can view
- Only owners can update

---

### `team_members`
Team membership and roles

**Columns:**
- `id` (UUID, PK) - Unique membership ID
- `team_id` (UUID, FK) - References `teams(id)`
- `user_id` (UUID, FK) - References `auth.users(id)`
- `role` (TEXT) - `admin`, `editor`, `member`, `viewer`
- `permissions` (JSONB) - Custom permissions
- `status` (TEXT) - `active`, `inactive`, `suspended`
- `created_at` (TIMESTAMPTZ) - Join date
- `updated_at` (TIMESTAMPTZ) - Last update

**Unique Constraint:**
- `(team_id, user_id)` - One membership per user per team

**RLS Policies:**
- Team members can view team
- Admins can manage members

---

### `team_invitations`
Pending team invitations

**Columns:**
- `id` (UUID, PK) - Unique invitation ID
- `team_id` (UUID, FK) - References `teams(id)`
- `email` (TEXT) - Invitee email
- `role` (TEXT) - Assigned role
- `permissions` (JSONB) - Custom permissions
- `invited_by` (UUID, FK) - References `auth.users(id)`
- `status` (TEXT) - `pending`, `accepted`, `declined`, `expired`
- `token` (TEXT, UNIQUE) - Invitation token
- `expires_at` (TIMESTAMPTZ) - Expiration (7 days)
- `created_at` (TIMESTAMPTZ) - Invitation date
- `accepted_at` (TIMESTAMPTZ) - Acceptance date

**RLS Policies:**
- Team members can view invitations
- Invitees can view their own invitations

---

### `api_usage_logs`
API usage tracking and analytics

**Columns:**
- `id` (UUID, PK) - Unique log ID
- `api_key_id` (UUID, FK) - References `api_keys(id)`
- `user_id` (UUID, FK) - References `auth.users(id)`
- `endpoint` (TEXT) - API endpoint called
- `method` (TEXT) - HTTP method
- `status_code` (INTEGER) - Response status
- `response_time_ms` (INTEGER) - Response time
- `ip_address` (TEXT) - Client IP
- `user_agent` (TEXT) - Client user agent
- `created_at` (TIMESTAMPTZ) - Request timestamp

**Indexes:**
- Index on `api_key_id`
- Index on `user_id`
- Index on `created_at`

**RLS Policies:**
- Users can view their own usage logs

---

## 📊 Monitoring Tables

### `monitored_content`
URLs being monitored for changes

**Columns:**
- `id` (UUID, PK) - Unique monitor ID
- `user_id` (UUID, FK) - References `profiles(id)`
- `url` (TEXT) - Monitored URL
- `title` (TEXT) - Page title
- `check_frequency` (TEXT) - `hourly`, `daily`, `weekly`, `monthly`
- `notify_on_change` (BOOLEAN) - Send notifications
- `auto_update` (BOOLEAN) - Auto-apply updates
- `last_snapshot` (JSONB) - Last captured state
- `last_checked` (TIMESTAMPTZ) - Last check time
- `last_change_detected` (TIMESTAMPTZ) - Last change time
- `changes_detected` (INTEGER) - Total changes count
- `status` (TEXT) - `active`, `paused`, `error`
- `error_message` (TEXT) - Last error
- `created_at` (TIMESTAMPTZ) - Monitor creation
- `updated_at` (TIMESTAMPTZ) - Last update

**Unique Constraint:**
- `(user_id, url)` - One monitor per URL per user

**Indexes:**
- Index on `user_id`
- Index on `status`
- Index on `last_checked`

**RLS Policies:**
- Users can manage their own monitors

---

### `content_changes`
History of detected content changes

**Columns:**
- `id` (UUID, PK) - Unique change ID
- `monitor_id` (UUID, FK) - References `monitored_content(id)`
- `user_id` (UUID, FK) - References `profiles(id)`
- `url` (TEXT) - Changed URL
- `changes` (JSONB) - Detected changes
- `snapshot_before` (JSONB) - State before change
- `snapshot_after` (JSONB) - State after change
- `detected_at` (TIMESTAMPTZ) - Detection timestamp
- `applied` (BOOLEAN) - Update applied
- `applied_at` (TIMESTAMPTZ) - Application timestamp

**Indexes:**
- Index on `monitor_id`
- Index on `user_id`
- Index on `detected_at DESC`

**RLS Policies:**
- Users can view/create their own change records

---

### `monitoring_rules`
Custom monitoring rules

**Columns:**
- `id` (UUID, PK) - Unique rule ID
- `monitor_id` (UUID, FK) - References `monitored_content(id)`
- `user_id` (UUID, FK) - References `profiles(id)`
- `rule_type` (TEXT) - `keyword`, `word_count`, `heading`, `link`, `image`, `custom`
- `rule_config` (JSONB) - Rule configuration
- `enabled` (BOOLEAN) - Rule active
- `created_at` (TIMESTAMPTZ) - Creation timestamp

**Indexes:**
- Index on `monitor_id`

**RLS Policies:**
- Users can manage their own rules

---

### `bulk_updates`
Batch update operations

**Columns:**
- `id` (UUID, PK) - Unique operation ID
- `user_id` (UUID, FK) - References `profiles(id)`
- `name` (TEXT) - Operation name
- `description` (TEXT) - Operation description
- `monitor_ids` (UUID[]) - Affected monitors
- `update_type` (TEXT) - `refresh`, `optimize`, `fix`
- `status` (TEXT) - `pending`, `processing`, `completed`, `failed`
- `progress` (INTEGER) - Completion percentage
- `total` (INTEGER) - Total items
- `results` (JSONB) - Operation results
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `started_at` (TIMESTAMPTZ) - Start time
- `completed_at` (TIMESTAMPTZ) - Completion time

**Indexes:**
- Index on `user_id`
- Index on `status`

**RLS Policies:**
- Users can manage their own bulk operations

---

## 🔗 Relationships

```
auth.users (Supabase Auth)
    ↓
profiles (1:1)
    ↓
    ├── audits (1:many)
    │     ↓
    │     └── optimizations (1:many)
    │           ↓
    │           └── images (1:many)
    │
    ├── monitored_content (1:many)
    │     ↓
    │     ├── content_changes (1:many)
    │     └── monitoring_rules (1:many)
    │
    ├── api_keys (1:many)
    │     ↓
    │     └── api_usage_logs (1:many)
    │
    ├── webhooks (1:many)
    │
    └── teams (1:many)
          ↓
          ├── team_members (1:many)
          └── team_invitations (1:many)
```

---

## 🔒 Security

### Row Level Security (RLS)

All tables have RLS enabled. Key policies:

1. **User Isolation**: Users can only access their own data
2. **Team Access**: Team members can access team data
3. **Service Role**: Backend bypasses RLS for admin operations

### Authentication

- Uses Supabase Auth (JWT tokens)
- Tokens stored in localStorage
- Auto-refresh before expiry
- Service key for server-side operations

---

## 🔧 Functions

### `increment_scan_count(user_id UUID)`
Increments user's scan usage counter

### `update_updated_at_column()`
Trigger function to auto-update `updated_at` timestamps

### `handle_new_user()`
Trigger function to auto-create profile on signup

### `update_api_key_usage()`
Trigger function to track API key usage

---

## 📈 Views

### `daily_audit_stats`
Daily audit statistics per user

**Columns:**
- `user_id`
- `date`
- `total_audits`
- `avg_score`
- `min_score`
- `max_score`
- Score distribution counts

### `monthly_usage_stats`
Monthly usage statistics per user

**Columns:**
- `user_id`
- `month`
- `total_audits`
- `avg_score`
- `unique_urls`

---

## 🧪 Testing

### Connection Test
```bash
node tests/test-db-connection.js
```

### CRUD Test
```bash
export TEST_USER_ID="your-user-id"
node tests/test-crud-operations.js
```

### Migration
```bash
# Dry run
node scripts/migrate-database.js --dry-run

# Run all migrations
node scripts/migrate-database.js

# Run specific file
node scripts/migrate-database.js --file=schema.sql
```

---

## 📚 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
