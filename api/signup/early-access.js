// Early Access Signup API
// Handles beta user signups and stores in Supabase

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    const { name, email, website, useCase } = req.body;

    // Validate required fields
    if (!name || !email || !useCase) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, email, useCase'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // Check if email already exists
    const { data: existing, error: checkError } = await supabase
      .from('early_access_signups')
      .select('email')
      .eq('email', email)
      .single();

    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Email already registered for early access'
      });
    }

    // Insert signup
    const { data, error } = await supabase
      .from('early_access_signups')
      .insert([
        {
          name,
          email,
          website: website || null,
          use_case: useCase,
          created_at: new Date().toISOString(),
          status: 'pending'
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to save signup'
      });
    }

    // Get total signup count
    const { count } = await supabase
      .from('early_access_signups')
      .select('*', { count: 'exact', head: true });

    // TODO: Send welcome email (integrate with SendGrid/Mailgun)
    // await sendWelcomeEmail(email, name);

    return res.status(200).json({
      success: true,
      message: 'Successfully registered for early access!',
      data: {
        id: data.id,
        spotsRemaining: Math.max(0, 50 - (count || 0))
      }
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}
