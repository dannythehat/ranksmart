import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);

// Generate content improvements (Mode A: Fix My Article)
export async function generateContentFixes(pageData, analysis) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  const prompt = `You are an expert SEO content optimizer. Given the following page content and E-E-A-T analysis, provide specific, surgical improvements to boost the SEO score.

Original Content:
Title: ${pageData.title}
Meta Description: ${pageData.description}
Word Count: ${pageData.wordCount}

Content:
${pageData.content.substring(0, 6000)}

Current E-E-A-T Score: ${analysis.overall_score}/100

Issues to Fix:
${analysis.priority_fixes.map(fix => `- ${fix.title}: ${fix.description}`).join('\n')}

Provide improvements in JSON format:
{
  "improved_title": "Better SEO title",
  "improved_description": "Better meta description",
  "content_additions": [
    {
      "section": "Introduction|Body|Conclusion",
      "content": "Text to add",
      "reason": "Why this improves E-E-A-T"
    }
  ],
  "content_modifications": [
    {
      "original": "Text to replace",
      "improved": "Better text",
      "reason": "Why this is better"
    }
  ],
  "new_sections": [
    {
      "title": "Section title",
      "content": "Section content",
      "placement": "after_intro|before_conclusion|end"
    }
  ],
  "estimated_new_score": <0-100>,
  "summary": "Brief summary of improvements"
}

Focus on:
- Adding author credentials and expertise signals
- Including first-hand experience examples
- Adding citations and references
- Improving content depth and accuracy
- Enhancing trust signals
- iGaming compliance mentions

Return ONLY valid JSON.`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error('Generate fixes error:', error);
    throw error;
  }
}

// Rewrite competitor content (Mode B: Rewrite Competitor Content)
export async function rewriteContent(competitorData, keyword, targetAudience = 'iGaming affiliates') {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  const prompt = `You are an expert SEO content writer specializing in ${targetAudience}. Rewrite the following competitor content to be 100% unique, better optimized, and higher quality.

Target Keyword: ${keyword}
Competitor URL: ${competitorData.url}
Competitor Title: ${competitorData.title}

Competitor Content:
${competitorData.content.substring(0, 6000)}

Create a completely new article that:
1. Covers the same topic but with unique angles
2. Includes better E-E-A-T signals
3. Has improved SEO optimization
4. Adds more value for readers
5. Includes iGaming compliance mentions if relevant

Provide the rewrite in JSON format:
{
  "title": "New SEO-optimized title",
  "meta_description": "Compelling meta description",
  "content": "Full article content in markdown format",
  "word_count": <number>,
  "key_improvements": ["improvement1", "improvement2"],
  "seo_keywords": ["keyword1", "keyword2"],
  "estimated_score": <0-100>,
  "image_suggestions": [
    {
      "placement": "hero|inline|conclusion",
      "description": "Image description for AI generation",
      "alt_text": "SEO-friendly alt text"
    }
  ]
}

Make it comprehensive (1500+ words), engaging, and authoritative.

Return ONLY valid JSON.`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error('Rewrite content error:', error);
    throw error;
  }
}

// Generate image prompt for Flux AI
export async function generateImagePrompt(context, style = 'professional') {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  const prompt = `Create a detailed image generation prompt for the following context:

Context: ${context}
Style: ${style}

Generate a prompt that will create a high-quality, relevant image. The prompt should be:
- Detailed and specific
- Include style, mood, and composition
- Mention colors and lighting
- Specify quality (4K, professional, etc.)

Return ONLY the image prompt text, no JSON or formatting.`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('Generate image prompt error:', error);
    throw error;
  }
}

// Summarize audit results
export async function summarizeAudit(analysis) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  const prompt = `Summarize this SEO audit in a concise, actionable way for a non-technical user:

Overall Score: ${analysis.overall_score}/100

E-E-A-T Scores:
- Experience: ${analysis.experience.score}/100
- Expertise: ${analysis.expertise.score}/100
- Authoritativeness: ${analysis.authoritativeness.score}/100
- Trustworthiness: ${analysis.trustworthiness.score}/100

Technical SEO: ${analysis.technical_seo.score}/100
Content Quality: ${analysis.content_quality.score}/100

Top Issues:
${analysis.priority_fixes.slice(0, 5).map(fix => `- ${fix.title}`).join('\n')}

Provide a 2-3 sentence summary that:
1. States the overall health
2. Highlights the biggest issue
3. Gives encouragement and next steps

Return ONLY the summary text, no formatting.`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('Summarize audit error:', error);
    throw error;
  }
}
