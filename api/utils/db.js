import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // Use service key for admin operations
);

// Verify user authentication
export async function verifyAuth(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Missing or invalid authorization header', user: null };
  }

  const token = authHeader.substring(7);

  try {
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error) {
      return { error: 'Invalid or expired token', user: null };
    }

    return { error: null, user: data.user };
  } catch (error) {
    return { error: 'Authentication failed', user: null };
  }
}

// Save audit result to database
export async function saveAudit(userId, auditData) {
  try {
    const { data, error } = await supabase
      .from('audits')
      .insert({
        user_id: userId,
        url: auditData.url,
        title: auditData.title,
        overall_score: auditData.overall_score,
        analysis: auditData.analysis,
        page_data: auditData.page_data,
        serp_data: auditData.serp_data,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Save audit error:', error);
    return { data: null, error: error.message };
  }
}

// Get user's audits
export async function getUserAudits(userId, limit = 10, offset = 0) {
  try {
    const { data, error } = await supabase
      .from('audits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Get audits error:', error);
    return { data: null, error: error.message };
  }
}

// Get single audit by ID
export async function getAudit(auditId, userId) {
  try {
    const { data, error } = await supabase
      .from('audits')
      .select('*')
      .eq('id', auditId)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Get audit error:', error);
    return { data: null, error: error.message };
  }
}

// Update user profile
export async function updateUserProfile(userId, updates) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Update profile error:', error);
    return { data: null, error: error.message };
  }
}

// Get user profile
export async function getUserProfile(userId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Get profile error:', error);
    return { data: null, error: error.message };
  }
}

// Check user's scan quota
export async function checkScanQuota(userId) {
  try {
    const { data: profile, error } = await getUserProfile(userId);
    
    if (error) throw error;

    const scansUsed = profile.scans_used || 0;
    const scansLimit = profile.scans_limit || 50; // Default to Starter plan

    return {
      hasQuota: scansUsed < scansLimit,
      scansUsed,
      scansLimit,
      scansRemaining: scansLimit - scansUsed,
    };
  } catch (error) {
    console.error('Check quota error:', error);
    return { hasQuota: false, error: error.message };
  }
}

// Increment scan count
export async function incrementScanCount(userId) {
  try {
    const { data, error } = await supabase.rpc('increment_scan_count', {
      user_id: userId,
    });

    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error('Increment scan error:', error);
    return { success: false, error: error.message };
  }
}
