"""
Content Manager Agent

Reviews content submissions, generates scores, creates annotations,
and provides educational feedback to writers.
"""

import uuid
from datetime import datetime
from typing import List, Dict, Optional
import google.generativeai as genai

from src.core.schemas import (
    ContentSubmission,
    ContentScore,
    IssueAnnotation,
    WriterFeedback,
    IssueSeverity,
    SubmissionStatus,
    SEOIssue,
    IssuePriority,
    IssueCategory
)


class ContentManagerAgent:
    """
    AI agent that reviews content submissions and provides detailed feedback.
    
    Responsibilities:
    - Analyze content for SEO, E-E-A-T, quality, and compliance
    - Generate multi-dimensional scores
    - Create color-coded issue annotations
    - Provide educational feedback for writers
    - Track improvement over time
    """
    
    def __init__(self, gemini_api_key: str):
        """Initialize the Content Manager Agent"""
        genai.configure(api_key=gemini_api_key)
        self.model = genai.GenerativeModel('gemini-2.0-flash-exp')
    
    async def review_submission(
        self,
        submission: ContentSubmission,
        target_keywords: Optional[List[str]] = None,
        jurisdiction: Optional[str] = None
    ) -> ContentSubmission:
        """
        Complete review of a content submission.
        
        Args:
            submission: Content submission to review
            target_keywords: Optional target keywords for SEO analysis
            jurisdiction: Optional jurisdiction for compliance (e.g., "UK", "Malta")
        
        Returns:
            Updated submission with scores, annotations, and feedback
        """
        # Update status
        submission.status = SubmissionStatus.IN_REVIEW
        submission.reviewed_at = datetime.now()
        
        # Step 1: Analyze content and generate scores
        scores = await self._generate_scores(
            submission.content,
            submission.title,
            target_keywords,
            jurisdiction
        )
        submission.scores = scores
        
        # Step 2: Detect and annotate issues
        annotations = await self._detect_and_annotate_issues(
            submission.content,
            submission.title,
            scores
        )
        submission.annotations = annotations
        
        # Step 3: Generate educational feedback
        feedback = await self._generate_feedback(
            submission,
            scores,
            annotations
        )
        submission.feedback = feedback
        
        # Update timestamp
        submission.updated_at = datetime.now()
        
        return submission
    
    async def _generate_scores(
        self,
        content: str,
        title: str,
        target_keywords: Optional[List[str]],
        jurisdiction: Optional[str]
    ) -> ContentScore:
        """Generate multi-dimensional content scores"""
        
        prompt = f"""
You are an expert content quality analyst. Analyze this article and provide scores (0-100) for each dimension.

**Article Title:** {title}

**Article Content:**
{content[:3000]}  # Limit for context

**Target Keywords:** {', '.join(target_keywords) if target_keywords else 'Not specified'}
**Jurisdiction:** {jurisdiction or 'Not specified'}

Provide scores for:

1. **SEO Score (0-100)**: Keywords usage, meta optimization, heading structure, internal linking potential
2. **E-E-A-T Score (0-100)**: Experience signals, expertise demonstration, authoritativeness, trustworthiness
3. **Content Quality (0-100)**: Originality, accuracy, readability, engagement
4. **Compliance Score (0-100)**: Adherence to regulations, legal requirements, industry standards

Return ONLY a JSON object with this exact structure:
{{
    "seo_score": <number>,
    "eeat_score": <number>,
    "content_quality": <number>,
    "compliance_score": <number>,
    "reasoning": {{
        "seo": "<brief explanation>",
        "eeat": "<brief explanation>",
        "quality": "<brief explanation>",
        "compliance": "<brief explanation>"
    }}
}}
"""
        
        response = await self.model.generate_content_async(prompt)
        result = self._parse_json_response(response.text)
        
        score = ContentScore(
            seo_score=result.get("seo_score", 50),
            eeat_score=result.get("eeat_score", 50),
            content_quality=result.get("content_quality", 50),
            compliance_score=result.get("compliance_score", 50),
            overall_score=0  # Will be calculated
        )
        score.calculate_overall()
        
        return score
    
    async def _detect_and_annotate_issues(
        self,
        content: str,
        title: str,
        scores: ContentScore
    ) -> List[IssueAnnotation]:
        """Detect issues and create educational annotations"""
        
        prompt = f"""
You are a content quality expert helping writers improve. Analyze this article and identify specific issues.

**Title:** {title}
**Content:** {content[:3000]}

**Current Scores:**
- SEO: {scores.seo_score}/100
- E-E-A-T: {scores.eeat_score}/100
- Quality: {scores.content_quality}/100
- Compliance: {scores.compliance_score}/100

For each issue found, provide:
1. **Severity**: "critical" (🔴), "warning" (🟡), or "suggestion" (🟢)
2. **Explanation**: WHY this is an issue (educational)
3. **Fix**: HOW to fix it (actionable)
4. **Learning Note**: Educational context to help writer improve

Focus on the TOP 10 most impactful issues. Return JSON array:
[
    {{
        "severity": "critical|warning|suggestion",
        "title": "<short title>",
        "explanation": "<why this matters>",
        "fix_suggestion": "<how to fix>",
        "learning_note": "<educational context>",
        "highlighted_text": "<text to highlight in article>"
    }}
]
"""
        
        response = await self.model.generate_content_async(prompt)
        issues_data = self._parse_json_response(response.text)
        
        annotations = []
        for issue in issues_data[:10]:  # Limit to top 10
            annotation = IssueAnnotation(
                issue_id=str(uuid.uuid4()),
                severity=IssueSeverity(issue.get("severity", "suggestion")),
                explanation=issue.get("explanation", ""),
                fix_suggestion=issue.get("fix_suggestion", ""),
                learning_note=issue.get("learning_note"),
                highlighted_text=issue.get("highlighted_text"),
                applied=False
            )
            annotations.append(annotation)
        
        return annotations
    
    async def _generate_feedback(
        self,
        submission: ContentSubmission,
        scores: ContentScore,
        annotations: List[IssueAnnotation]
    ) -> WriterFeedback:
        """Generate comprehensive educational feedback"""
        
        critical_count = sum(1 for a in annotations if a.severity == IssueSeverity.CRITICAL)
        warning_count = sum(1 for a in annotations if a.severity == IssueSeverity.WARNING)
        
        prompt = f"""
You are a supportive content manager providing feedback to a writer.

**Writer:** {submission.writer_name}
**Article:** {submission.title}
**Overall Score:** {scores.overall_score}/100

**Scores Breakdown:**
- SEO: {scores.seo_score}/100
- E-E-A-T: {scores.eeat_score}/100
- Quality: {scores.content_quality}/100
- Compliance: {scores.compliance_score}/100

**Issues Found:**
- 🔴 Critical: {critical_count}
- 🟡 Warnings: {warning_count}
- 🟢 Suggestions: {len(annotations) - critical_count - warning_count}

Provide constructive feedback with:
1. **Overall Comment**: Encouraging but honest assessment
2. **Strengths**: 3-5 things the writer did well
3. **Areas for Improvement**: 3-5 specific areas to work on
4. **Learning Resources**: 2-3 helpful links or resources

Return JSON:
{{
    "overall_comment": "<encouraging feedback>",
    "strengths": ["<strength 1>", "<strength 2>", ...],
    "areas_for_improvement": ["<area 1>", "<area 2>", ...],
    "learning_resources": ["<resource 1>", "<resource 2>", ...]
}}
"""
        
        response = await self.model.generate_content_async(prompt)
        feedback_data = self._parse_json_response(response.text)
        
        feedback = WriterFeedback(
            submission_id=submission.submission_id,
            manager_id="system",  # Will be replaced with actual manager ID
            overall_comment=feedback_data.get("overall_comment", ""),
            strengths=feedback_data.get("strengths", []),
            areas_for_improvement=feedback_data.get("areas_for_improvement", []),
            learning_resources=feedback_data.get("learning_resources", [])
        )
        
        return feedback
    
    async def apply_fixes(
        self,
        submission: ContentSubmission,
        annotation_ids: List[str]
    ) -> str:
        """
        Apply AI-suggested fixes to content.
        
        Args:
            submission: Content submission
            annotation_ids: List of annotation IDs to apply
        
        Returns:
            Updated content with fixes applied
        """
        # Get annotations to apply
        annotations_to_apply = [
            a for a in submission.annotations 
            if a.issue_id in annotation_ids
        ]
        
        if not annotations_to_apply:
            return submission.content
        
        # Build fix instructions
        fix_instructions = "\n".join([
            f"- {a.explanation}: {a.fix_suggestion}"
            for a in annotations_to_apply
        ])
        
        prompt = f"""
Apply these fixes to the article while preserving the writer's voice and style.

**Original Content:**
{submission.content}

**Fixes to Apply:**
{fix_instructions}

Return the updated content with fixes applied. Maintain the original format (markdown/HTML).
"""
        
        response = await self.model.generate_content_async(prompt)
        updated_content = response.text.strip()
        
        # Mark annotations as applied
        for annotation in submission.annotations:
            if annotation.issue_id in annotation_ids:
                annotation.applied = True
        
        return updated_content
    
    def _parse_json_response(self, text: str) -> Dict:
        """Parse JSON from AI response, handling markdown code blocks"""
        import json
        import re
        
        # Remove markdown code blocks if present
        text = re.sub(r'```json\s*', '', text)
        text = re.sub(r'```\s*', '', text)
        text = text.strip()
        
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            # Fallback: try to extract JSON object
            match = re.search(r'\{.*\}', text, re.DOTALL)
            if match:
                return json.loads(match.group())
            return {}
