import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        error: 'Email is required' 
      });
    }

    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.VERCEL_URL || 'http://localhost:3000'}/reset-password.html`,
    });

    if (error) {
      console.error('Password reset error:', error);
      return res.status(400).json({ 
        error: error.message 
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Password reset email sent. Please check your inbox.',
    });

  } catch (error) {
    console.error('Password reset error:', error);
    return res.status(500).json({ 
      error: 'Failed to send password reset email' 
    });
  }
}
