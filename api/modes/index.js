/**
 * Two-Mode System API Router
 * Unified interface for Mode 1 (Competitor Analysis) and Mode 2 (Self-Audit)
 */

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    // Return API documentation
    return res.status(200).json({
      success: true,
      message: 'RankSmart Two-Mode System API',
      version: '1.0.0',
      modes: {
        mode1: {
          name: 'Competitor Content Generator',
          description: 'Analyze competitors and generate superior content',
          endpoint: '/api/content/generate',
          method: 'POST',
          requires: ['keyword', 'serpData'],
          optional: ['targetUrl', 'style'],
          flow: [
            '1. Get SERP data: POST /api/audit/serp with {keyword}',
            '2. Generate content: POST /api/content/generate with {keyword, serpData, style}'
          ]
        },
        mode2: {
          name: 'Self-Audit & Fixes',
          description: 'Analyze your content and get actionable improvements',
          endpoint: '/api/audit/self-scan',
          method: 'POST',
          requires: ['url', 'content'],
          optional: ['serpData'],
          flow: [
            '1. Self-audit: POST /api/audit/self-scan with {url, content}',
            '2. Apply fixes: POST /api/audit/apply-fixes with {url, fixes}'
          ]
        }
      },
      supportingEndpoints: {
        serpAnalysis: {
          endpoint: '/api/audit/serp',
          method: 'POST',
          description: 'Analyze top 10 SERP results for a keyword',
          requires: ['keyword']
        },
        applyFixes: {
          endpoint: '/api/audit/apply-fixes',
          method: 'POST',
          description: 'Apply selected fixes to content',
          requires: ['url', 'fixes']
        }
      },
      examples: {
        mode1: {
          step1: {
            endpoint: '/api/audit/serp',
            payload: {
              keyword: 'best online casinos 2025'
            }
          },
          step2: {
            endpoint: '/api/content/generate',
            payload: {
              keyword: 'best online casinos 2025',
              serpData: '{ /* SERP response from step 1 */ }',
              style: 'professional'
            }
          }
        },
        mode2: {
          step1: {
            endpoint: '/api/audit/self-scan',
            payload: {
              url: 'https://yoursite.com/article',
              content: 'Your article content here...'
            }
          },
          step2: {
            endpoint: '/api/audit/apply-fixes',
            payload: {
              url: 'https://yoursite.com/article',
              fixes: ['fix-1', 'fix-2', 'fix-3']
            }
          }
        }
      },
      ui: {
        interface: '/public/two-mode-system.html',
        description: 'User-friendly interface for both modes'
      }
    });
  }

  return res.status(405).json({
    error: 'Method not allowed',
    message: 'This endpoint only accepts GET requests for documentation'
  });
}
