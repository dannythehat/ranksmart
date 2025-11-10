/**
 * User Domains Management API
 * Manage user's internal domains for URL detection
 */

import { verifyAuth, getUserDomains, addUserDomain, removeUserDomain, updateUserDomains } from '../utils/db.js';
import { normalizeDomain, validateDomains } from '../utils/domain-detector.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Verify authentication
  const { error: authError, user } = await verifyAuth(req.headers.authorization);
  
  if (authError || !user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: authError || 'Please log in to manage domains'
    });
  }

  const userId = user.id;

  try {
    // GET - Retrieve user's domains
    if (req.method === 'GET') {
      const { data: domains, error } = await getUserDomains(userId);

      if (error) {
        return res.status(500).json({
          error: 'Failed to retrieve domains',
          message: error
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          domains,
          count: domains.length
        }
      });
    }

    // POST - Add a new domain
    if (req.method === 'POST') {
      const { domain } = req.body;

      if (!domain) {
        return res.status(400).json({
          error: 'Domain is required',
          message: 'Please provide a domain to add'
        });
      }

      // Normalize and validate domain
      const normalizedDomain = normalizeDomain(domain);
      
      if (!normalizedDomain) {
        return res.status(400).json({
          error: 'Invalid domain',
          message: 'Please provide a valid domain (e.g., example.com)'
        });
      }

      const { data: updatedDomains, error } = await addUserDomain(userId, normalizedDomain);

      if (error) {
        return res.status(500).json({
          error: 'Failed to add domain',
          message: error
        });
      }

      return res.status(200).json({
        success: true,
        message: `Domain "${normalizedDomain}" added successfully`,
        data: {
          domains: updatedDomains,
          count: updatedDomains.length
        }
      });
    }

    // PUT - Update all domains (replace)
    if (req.method === 'PUT') {
      const { domains } = req.body;

      if (!Array.isArray(domains)) {
        return res.status(400).json({
          error: 'Invalid input',
          message: 'Domains must be an array'
        });
      }

      // Validate all domains
      const validation = validateDomains(domains);

      if (!validation.valid) {
        return res.status(400).json({
          error: 'Invalid domains',
          message: validation.error,
          invalidDomains: validation.invalidDomains
        });
      }

      const { data: updatedDomains, error } = await updateUserDomains(userId, validation.validDomains);

      if (error) {
        return res.status(500).json({
          error: 'Failed to update domains',
          message: error
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Domains updated successfully',
        data: {
          domains: updatedDomains,
          count: updatedDomains.length
        }
      });
    }

    // DELETE - Remove a domain
    if (req.method === 'DELETE') {
      const { domain } = req.body;

      if (!domain) {
        return res.status(400).json({
          error: 'Domain is required',
          message: 'Please provide a domain to remove'
        });
      }

      const { data: updatedDomains, error } = await removeUserDomain(userId, domain);

      if (error) {
        return res.status(500).json({
          error: 'Failed to remove domain',
          message: error
        });
      }

      return res.status(200).json({
        success: true,
        message: `Domain "${domain}" removed successfully`,
        data: {
          domains: updatedDomains,
          count: updatedDomains.length
        }
      });
    }

    return res.status(405).json({
      error: 'Method not allowed',
      message: 'This endpoint only accepts GET, POST, PUT, DELETE requests'
    });

  } catch (error) {
    console.error('[DOMAINS API] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'An unexpected error occurred'
    });
  }
}
