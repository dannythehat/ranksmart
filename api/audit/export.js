/**
 * Audit Export Endpoint
 * Export audit results in various formats (JSON, PDF, HTML)
 */

import { getAudit } from '../utils/db.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'This endpoint only accepts GET requests' 
    });
  }

  try {
    const { auditId, format = 'json' } = req.query;

    // Validate audit ID
    if (!auditId) {
      return res.status(400).json({ 
        error: 'Audit ID is required',
        message: 'Please provide an auditId query parameter' 
      });
    }

    // For now, we'll skip authentication for demo purposes
    // In production, verify user authentication here
    // const authHeader = req.headers.authorization;
    // const { error: authError, user } = await verifyAuth(authHeader);
    // if (authError) {
    //   return res.status(401).json({ error: authError });
    // }

    // Get audit from database
    // For now, return mock data since we don't have auth
    // const { data: audit, error } = await getAudit(auditId, user.id);
    // if (error) {
    //   return res.status(404).json({ error: 'Audit not found' });
    // }

    // Mock audit data for demo
    const audit = {
      id: auditId,
      url: 'https://example.com',
      title: 'Example Page',
      overall_score: 85,
      analysis: {
        eeat: {
          overall: 82,
          breakdown: {
            experience: 75,
            expertise: 85,
            authoritativeness: 80,
            trustworthiness: 88
          }
        },
        technical: {
          overall: 88,
          breakdown: {
            metaTags: 90,
            headings: 85,
            images: 80,
            internalLinks: 92,
            contentQuality: 88
          }
        }
      },
      created_at: new Date().toISOString()
    };

    // Export based on format
    switch (format.toLowerCase()) {
      case 'json':
        return exportJSON(res, audit);
      
      case 'html':
        return exportHTML(res, audit);
      
      case 'pdf':
        return exportPDF(res, audit);
      
      default:
        return res.status(400).json({ 
          error: 'Invalid format',
          message: 'Supported formats: json, html, pdf' 
        });
    }

  } catch (error) {
    console.error('[EXPORT ERROR]', error);
    return res.status(500).json({ 
      error: 'Export failed',
      message: error.message 
    });
  }
}

/**
 * Export as JSON
 */
function exportJSON(res, audit) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="audit-${audit.id}.json"`);
  return res.status(200).json(audit);
}

/**
 * Export as HTML
 */
function exportHTML(res, audit) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SEO Audit Report - ${audit.title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background: #f9fafb;
      padding: 2rem;
    }
    .container { max-width: 1000px; margin: 0 auto; background: white; padding: 3rem; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .header { text-align: center; margin-bottom: 3rem; padding-bottom: 2rem; border-bottom: 2px solid #e5e7eb; }
    .header h1 { font-size: 2.5rem; color: #6366f1; margin-bottom: 0.5rem; }
    .header .url { color: #6b7280; font-size: 1.1rem; }
    .score-hero { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; border-radius: 12px; text-align: center; margin-bottom: 2rem; }
    .score-number { font-size: 4rem; font-weight: 700; }
    .score-grade { font-size: 1.5rem; opacity: 0.9; }
    .section { margin-bottom: 2rem; }
    .section h2 { font-size: 1.75rem; color: #1f2937; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid #e5e7eb; }
    .metric { display: flex; justify-content: space-between; padding: 1rem; background: #f9fafb; border-radius: 8px; margin-bottom: 0.75rem; }
    .metric-label { font-weight: 600; color: #374151; }
    .metric-value { font-weight: 700; color: #6366f1; }
    .footer { text-align: center; margin-top: 3rem; padding-top: 2rem; border-top: 2px solid #e5e7eb; color: #6b7280; }
    @media print { body { padding: 0; } .container { box-shadow: none; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚀 SEO Audit Report</h1>
      <p class="url">${audit.url}</p>
      <p style="color: #6b7280; margin-top: 0.5rem;">Generated on ${new Date(audit.created_at).toLocaleDateString()}</p>
    </div>

    <div class="score-hero">
      <div class="score-number">${audit.overall_score}</div>
      <div class="score-grade">Overall Score</div>
    </div>

    <div class="section">
      <h2>📊 E-E-A-T Analysis</h2>
      <div class="metric">
        <span class="metric-label">Overall E-E-A-T Score</span>
        <span class="metric-value">${audit.analysis.eeat.overall}/100</span>
      </div>
      <div class="metric">
        <span class="metric-label">Experience</span>
        <span class="metric-value">${audit.analysis.eeat.breakdown.experience}/100</span>
      </div>
      <div class="metric">
        <span class="metric-label">Expertise</span>
        <span class="metric-value">${audit.analysis.eeat.breakdown.expertise}/100</span>
      </div>
      <div class="metric">
        <span class="metric-label">Authoritativeness</span>
        <span class="metric-value">${audit.analysis.eeat.breakdown.authoritativeness}/100</span>
      </div>
      <div class="metric">
        <span class="metric-label">Trustworthiness</span>
        <span class="metric-value">${audit.analysis.eeat.breakdown.trustworthiness}/100</span>
      </div>
    </div>

    <div class="section">
      <h2>🔧 Technical SEO</h2>
      <div class="metric">
        <span class="metric-label">Overall Technical Score</span>
        <span class="metric-value">${audit.analysis.technical.overall}/100</span>
      </div>
      <div class="metric">
        <span class="metric-label">Meta Tags</span>
        <span class="metric-value">${audit.analysis.technical.breakdown.metaTags}/100</span>
      </div>
      <div class="metric">
        <span class="metric-label">Headings</span>
        <span class="metric-value">${audit.analysis.technical.breakdown.headings}/100</span>
      </div>
      <div class="metric">
        <span class="metric-label">Images</span>
        <span class="metric-value">${audit.analysis.technical.breakdown.images}/100</span>
      </div>
      <div class="metric">
        <span class="metric-label">Internal Links</span>
        <span class="metric-value">${audit.analysis.technical.breakdown.internalLinks}/100</span>
      </div>
      <div class="metric">
        <span class="metric-label">Content Quality</span>
        <span class="metric-value">${audit.analysis.technical.breakdown.contentQuality}/100</span>
      </div>
    </div>

    <div class="footer">
      <p>Generated by <strong>RankSmart 2.0</strong> - AI-Powered SEO Content Optimizer</p>
      <p style="margin-top: 0.5rem;">https://ranksmart.io</p>
    </div>
  </div>
</body>
</html>
  `;

  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Content-Disposition', `attachment; filename="audit-${audit.id}.html"`);
  return res.status(200).send(html);
}

/**
 * Export as PDF (placeholder - requires PDF generation library)
 */
function exportPDF(res, audit) {
  // For now, return HTML that can be printed to PDF
  // In production, use a library like puppeteer or pdfkit
  return res.status(501).json({ 
    error: 'PDF export not yet implemented',
    message: 'Please use HTML export and print to PDF, or use JSON export',
    suggestion: 'Try format=html instead'
  });
}
