import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { pageData } = req.body;

    if (!pageData || !pageData.content) {
      return res.status(400).json({ 
        error: 'Page data with content is required' 
      });
    }

    // Initialize Gemini model
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    // Create E-E-A-T analysis prompt
    const prompt = `You are an expert SEO analyst specializing in E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) evaluation for iGaming and affiliate content.

Analyze the following webpage content and provide a detailed E-E-A-T score breakdown:

URL: ${pageData.url}
Title: ${pageData.title}
Word Count: ${pageData.wordCount}

Content:
${pageData.content.substring(0, 8000)}

Provide your analysis in the following JSON format:
{
  "overall_score": <0-100>,
  "experience": {
    "score": <0-100>,
    "issues": ["issue1", "issue2"],
    "strengths": ["strength1", "strength2"]
  },
  "expertise": {
    "score": <0-100>,
    "issues": ["issue1", "issue2"],
    "strengths": ["strength1", "strength2"]
  },
  "authoritativeness": {
    "score": <0-100>,
    "issues": ["issue1", "issue2"],
    "strengths": ["strength1", "strength2"]
  },
  "trustworthiness": {
    "score": <0-100>,
    "issues": ["issue1", "issue2"],
    "strengths": ["strength1", "strength2"]
  },
  "technical_seo": {
    "score": <0-100>,
    "issues": ["issue1", "issue2"],
    "strengths": ["strength1", "strength2"]
  },
  "content_quality": {
    "score": <0-100>,
    "issues": ["issue1", "issue2"],
    "strengths": ["strength1", "strength2"]
  },
  "priority_fixes": [
    {
      "title": "Fix title",
      "description": "Description",
      "impact": "high|medium|low",
      "category": "experience|expertise|authoritativeness|trustworthiness|technical|content"
    }
  ],
  "summary": "Brief overall summary of the page's SEO health"
}

Focus on:
- Author credentials and expertise signals
- First-hand experience indicators
- Citation quality and external references
- Content depth and accuracy
- Technical SEO elements (title, meta, headings)
- iGaming compliance and responsible gambling mentions
- User trust signals (contact info, privacy policy, etc.)

Return ONLY valid JSON, no markdown formatting.`;

    // Generate analysis
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Parse JSON response
    let analysis;
    try {
      // Remove markdown code blocks if present
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysis = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return res.status(500).json({ 
        error: 'Failed to parse AI response',
        rawResponse: text 
      });
    }

    return res.status(200).json({
      success: true,
      analysis: analysis,
      analyzedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Analysis error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
