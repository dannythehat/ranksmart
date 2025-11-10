/**
 * RankSmart Team Management
 * Manage team members, roles, and permissions (Agency plan)
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // Use service key for admin operations
);

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Get user from authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check if user has agency plan
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('plan, team_id')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.plan !== 'agency') {
      return res.status(403).json({ 
        error: 'Team management requires Agency plan',
        upgrade_url: '/pricing'
      });
    }

    // GET - List team members
    if (req.method === 'GET') {
      const { data: members, error } = await supabase
        .from('team_members')
        .select(`
          *,
          user_profiles (
            name,
            email,
            created_at
          )
        `)
        .eq('team_id', profile.team_id)
        .order('created_at', { ascending: false });

      if (error) {
        return res.status(400).json({ 
          error: 'Failed to fetch team members',
          details: error.message 
        });
      }

      return res.status(200).json({
        success: true,
        team_id: profile.team_id,
        members: members.map(m => ({
          id: m.id,
          user_id: m.user_id,
          name: m.user_profiles?.name,
          email: m.user_profiles?.email,
          role: m.role,
          permissions: m.permissions,
          status: m.status,
          joined_at: m.created_at
        })),
        total: members.length
      });
    }

    // POST - Invite team member
    if (req.method === 'POST') {
      const { email, role = 'member', permissions = [] } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      // Validate role
      const validRoles = ['admin', 'editor', 'member', 'viewer'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('email', email)
        .single();

      let invitedUserId;

      if (existingUser) {
        // User exists, add to team
        invitedUserId = existingUser.user_id;
      } else {
        // Create invitation (user will sign up later)
        const { data: invitation, error: inviteError } = await supabase
          .from('team_invitations')
          .insert({
            team_id: profile.team_id,
            email,
            role,
            permissions,
            invited_by: user.id,
            status: 'pending'
          })
          .select()
          .single();

        if (inviteError) {
          return res.status(400).json({ 
            error: 'Failed to create invitation',
            details: inviteError.message 
          });
        }

        // TODO: Send invitation email

        return res.status(201).json({
          success: true,
          message: 'Invitation sent',
          invitation: {
            id: invitation.id,
            email,
            role,
            status: 'pending'
          }
        });
      }

      // Add existing user to team
      const { data: member, error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: profile.team_id,
          user_id: invitedUserId,
          role,
          permissions,
          status: 'active'
        })
        .select()
        .single();

      if (memberError) {
        return res.status(400).json({ 
          error: 'Failed to add team member',
          details: memberError.message 
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Team member added',
        member: {
          id: member.id,
          email,
          role,
          status: 'active'
        }
      });
    }

    // PUT - Update team member
    if (req.method === 'PUT') {
      const { member_id, role, permissions, status } = req.body;

      if (!member_id) {
        return res.status(400).json({ error: 'member_id is required' });
      }

      const updates = {};
      if (role) updates.role = role;
      if (permissions) updates.permissions = permissions;
      if (status) updates.status = status;

      const { data, error } = await supabase
        .from('team_members')
        .update(updates)
        .eq('id', member_id)
        .eq('team_id', profile.team_id)
        .select()
        .single();

      if (error) {
        return res.status(400).json({ 
          error: 'Failed to update team member',
          details: error.message 
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Team member updated',
        member: data
      });
    }

    // DELETE - Remove team member
    if (req.method === 'DELETE') {
      const { member_id } = req.body;

      if (!member_id) {
        return res.status(400).json({ error: 'member_id is required' });
      }

      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', member_id)
        .eq('team_id', profile.team_id);

      if (error) {
        return res.status(400).json({ 
          error: 'Failed to remove team member',
          details: error.message 
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Team member removed'
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Team management error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
