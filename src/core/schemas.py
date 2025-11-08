"""
RankSmart 2.0 - Data Schemas

Pydantic models for structured data throughout the application.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, HttpUrl
from datetime import datetime
from enum import Enum


# ===================================
# Enums
# ===================================

class IssuePriority(str, Enum):
    """Issue priority levels"""
    CRITICAL = "P0"  # Must fix immediately
    IMPORTANT = "P1"  # Should fix soon
    NICE_TO_HAVE = "P2"  # Can fix later


class IssueCategory(str, Enum):
    """Issue categories"""
    TECHNICAL = "technical"
    CONTENT = "content"
    META = "meta"
    STRUCTURE = "structure"
    COMPLIANCE = "compliance"
    PERFORMANCE = "performance"


class ContentMode(str, Enum):
    """Content optimization modes"""
    FIX = "fix"  # Fix existing article
    REWRITE = "rewrite"  # Complete rewrite


class SubmissionStatus(str, Enum):
    """Content submission status"""
    PENDING_REVIEW = "pending_review"
    IN_REVIEW = "in_review"
    NEEDS_REVISION = "needs_revision"
    APPROVED = "approved"
    PUBLISHED = "published"


class UserRole(str, Enum):
    """User roles in content team"""
    WRITER = "writer"
    MANAGER = "manager"
    ADMIN = "admin"


class IssueSeverity(str, Enum):
    """Issue severity for annotations"""
    CRITICAL = "critical"  # 🔴
    WARNING = "warning"    # 🟡
    SUGGESTION = "suggestion"  # 🟢


# ===================================
# E-E-A-T Scoring
# ===================================

class EEATScore(BaseModel):
    """E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) Score"""
    experience: int = Field(..., ge=0, le=100, description="Experience score (0-100)")
    expertise: int = Field(..., ge=0, le=100, description="Expertise score (0-100)")
    authoritativeness: int = Field(..., ge=0, le=100, description="Authoritativeness score (0-100)")
    trustworthiness: int = Field(..., ge=0, le=100, description="Trustworthiness score (0-100)")
    overall: int = Field(..., ge=0, le=100, description="Overall E-E-A-T score (0-100)")
    
    def calculate_overall(self):
        """Calculate overall score as average of all components"""
        self.overall = round((self.experience + self.expertise + self.authoritativeness + self.trustworthiness) / 4)


# ===================================
# SEO Issues
# ===================================

class SEOIssue(BaseModel):
    """Individual SEO issue"""
    id: str = Field(..., description="Unique issue identifier")
    title: str = Field(..., description="Short issue title")
    description: str = Field(..., description="Detailed description")
    priority: IssuePriority = Field(..., description="Issue priority")
    category: IssueCategory = Field(..., description="Issue category")
    impact: str = Field(..., description="Expected impact if fixed")
    effort: str = Field(..., description="Effort required to fix (Low/Medium/High)")
    fix_suggestion: Optional[str] = Field(None, description="Suggested fix")
    current_value: Optional[str] = Field(None, description="Current problematic value")
    recommended_value: Optional[str] = Field(None, description="Recommended value")


class IssuesSummary(BaseModel):
    """Summary of all issues found"""
    total: int = Field(..., description="Total number of issues")
    critical: int = Field(..., description="Number of critical issues")
    important: int = Field(..., description="Number of important issues")
    nice_to_have: int = Field(..., description="Number of nice-to-have issues")
    issues: List[SEOIssue] = Field(default_factory=list, description="List of all issues")


# ===================================
# Page Audit
# ===================================

class HeadingItem(BaseModel):
    """HTML heading element"""
    tag: str = Field(..., description="Heading tag (h1, h2, h3, etc.)")
    text: str = Field(..., description="Heading text content")


class LinkCounts(BaseModel):
    """Link statistics"""
    internal: int = Field(default=0, description="Number of internal links")
    external: int = Field(default=0, description="Number of external links")
    broken: int = Field(default=0, description="Number of broken links")


class PageMetadata(BaseModel):
    """Page metadata"""
    title_tag: str = Field(..., description="Page title tag")
    meta_description: Optional[str] = Field(None, description="Meta description")
    canonical_url: Optional[str] = Field(None, description="Canonical URL")
    og_title: Optional[str] = Field(None, description="Open Graph title")
    og_description: Optional[str] = Field(None, description="Open Graph description")
    og_image: Optional[str] = Field(None, description="Open Graph image")


class ContentAnalysis(BaseModel):
    """Content analysis results"""
    word_count: int = Field(..., description="Total word count")
    paragraph_count: int = Field(..., description="Number of paragraphs")
    sentence_count: int = Field(..., description="Number of sentences")
    readability_score: Optional[float] = Field(None, description="Flesch reading ease score")
    keyword_density: Dict[str, float] = Field(default_factory=dict, description="Keyword density map")


class PageAuditResult(BaseModel):
    """Complete page audit results"""
    url: str = Field(..., description="Audited URL")
    metadata: PageMetadata = Field(..., description="Page metadata")
    headings: List[HeadingItem] = Field(default_factory=list, description="All headings")
    content_analysis: ContentAnalysis = Field(..., description="Content analysis")
    links: LinkCounts = Field(..., description="Link statistics")
    technical_findings: List[str] = Field(default_factory=list, description="Technical issues found")
    eeat_score: EEATScore = Field(..., description="E-E-A-T score")
    seo_score: int = Field(..., ge=0, le=100, description="Overall SEO score (0-100)")
    issues: IssuesSummary = Field(..., description="All issues found")
    target_keywords: List[str] = Field(default_factory=list, description="Inferred target keywords")


# ===================================
# SERP Analysis
# ===================================

class SERPResult(BaseModel):
    """Individual SERP result"""
    rank: int = Field(..., description="Search result position")
    title: str = Field(..., description="Page title")
    url: str = Field(..., description="Page URL")
    snippet: str = Field(..., description="Meta description snippet")
    domain: str = Field(..., description="Domain name")


class SERPAnalysis(BaseModel):
    """SERP analysis results"""
    keyword: str = Field(..., description="Analyzed keyword")
    results: List[SERPResult] = Field(default_factory=list, description="Top 10 results")
    title_patterns: List[str] = Field(default_factory=list, description="Common title patterns")
    content_themes: List[str] = Field(default_factory=list, description="Common content themes")
    opportunities: List[str] = Field(default_factory=list, description="Identified opportunities")
    differentiation_angles: List[str] = Field(default_factory=list, description="Ways to differentiate")


# ===================================
# Content Optimization
# ===================================

class ContentFix(BaseModel):
    """Individual content fix"""
    type: str = Field(..., description="Fix type (heading, meta, content, etc.)")
    before: str = Field(..., description="Content before fix")
    after: str = Field(..., description="Content after fix")
    reason: str = Field(..., description="Reason for the fix")


class OptimizationResult(BaseModel):
    """Content optimization results"""
    mode: ContentMode = Field(..., description="Optimization mode used")
    original_score: int = Field(..., description="Original SEO score")
    new_score: int = Field(..., description="New SEO score after optimization")
    fixes_applied: List[ContentFix] = Field(default_factory=list, description="All fixes applied")
    optimized_content: str = Field(..., description="Optimized content (HTML or Markdown)")
    images_generated: List[str] = Field(default_factory=list, description="URLs of generated images")
    estimated_improvement: str = Field(..., description="Estimated ranking improvement")


# ===================================
# Compliance (iGaming)
# ===================================

class ComplianceIssue(BaseModel):
    """Compliance issue"""
    regulation: str = Field(..., description="Regulation name (e.g., UKGC 2025)")
    issue: str = Field(..., description="Compliance issue description")
    severity: IssuePriority = Field(..., description="Issue severity")
    recommendation: str = Field(..., description="How to fix")


class ComplianceCheck(BaseModel):
    """Compliance check results"""
    jurisdiction: str = Field(..., description="Jurisdiction (UK, Malta, Curacao, etc.)")
    compliant: bool = Field(..., description="Whether content is compliant")
    issues: List[ComplianceIssue] = Field(default_factory=list, description="Compliance issues found")
    last_updated: datetime = Field(default_factory=datetime.now, description="Last regulation update check")


# ===================================
# Bulk Scanning
# ===================================

class BulkScanJob(BaseModel):
    """Bulk scanning job"""
    job_id: str = Field(..., description="Unique job identifier")
    urls: List[str] = Field(..., description="URLs to scan")
    status: str = Field(default="pending", description="Job status")
    completed: int = Field(default=0, description="Number of completed scans")
    total: int = Field(..., description="Total number of URLs")
    results: List[PageAuditResult] = Field(default_factory=list, description="Scan results")
    created_at: datetime = Field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None


# ===================================
# Content Manager & Writer System
# ===================================

class ContentScore(BaseModel):
    """Multi-dimensional content scoring"""
    seo_score: int = Field(..., ge=0, le=100, description="SEO score (keywords, meta, structure)")
    eeat_score: int = Field(..., ge=0, le=100, description="E-E-A-T score")
    content_quality: int = Field(..., ge=0, le=100, description="Content quality (originality, accuracy, readability)")
    compliance_score: int = Field(..., ge=0, le=100, description="Compliance score (legislation, regulations)")
    overall_score: int = Field(..., ge=0, le=100, description="Overall composite score")
    
    def calculate_overall(self):
        """Calculate overall score as weighted average"""
        self.overall_score = round(
            (self.seo_score * 0.3) + 
            (self.eeat_score * 0.25) + 
            (self.content_quality * 0.25) + 
            (self.compliance_score * 0.2)
        )


class IssueAnnotation(BaseModel):
    """Annotated issue with educational context"""
    issue_id: str = Field(..., description="Reference to SEOIssue ID")
    severity: IssueSeverity = Field(..., description="Visual severity indicator")
    explanation: str = Field(..., description="Why this is an issue (educational)")
    fix_suggestion: str = Field(..., description="How to fix it")
    learning_note: Optional[str] = Field(None, description="Educational note for writer")
    applied: bool = Field(default=False, description="Whether fix was applied by manager")
    line_number: Optional[int] = Field(None, description="Line number in content")
    highlighted_text: Optional[str] = Field(None, description="Text to highlight")


class WriterFeedback(BaseModel):
    """Manager feedback to writer"""
    submission_id: str = Field(..., description="Content submission ID")
    manager_id: str = Field(..., description="Manager user ID")
    overall_comment: str = Field(..., description="General feedback")
    strengths: List[str] = Field(default_factory=list, description="What writer did well")
    areas_for_improvement: List[str] = Field(default_factory=list, description="What to improve")
    learning_resources: List[str] = Field(default_factory=list, description="Helpful resources/links")
    created_at: datetime = Field(default_factory=datetime.now)


class ContentSubmission(BaseModel):
    """Content submission from writer"""
    submission_id: str = Field(..., description="Unique submission ID")
    writer_id: str = Field(..., description="Writer user ID")
    writer_name: str = Field(..., description="Writer display name")
    manager_id: Optional[str] = Field(None, description="Assigned manager ID")
    title: str = Field(..., description="Article title")
    content: str = Field(..., description="Article content (markdown/HTML)")
    content_format: str = Field(default="markdown", description="Content format")
    status: SubmissionStatus = Field(default=SubmissionStatus.PENDING_REVIEW)
    scores: Optional[ContentScore] = Field(None, description="Content scores")
    annotations: List[IssueAnnotation] = Field(default_factory=list, description="Issue annotations")
    feedback: Optional[WriterFeedback] = Field(None, description="Manager feedback")
    revision_count: int = Field(default=0, description="Number of revisions")
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    reviewed_at: Optional[datetime] = Field(None)
    published_at: Optional[datetime] = Field(None)


class WriterSkillArea(BaseModel):
    """Skill area tracking for writer"""
    skill_name: str = Field(..., description="Skill area (e.g., 'SEO Optimization', 'E-E-A-T')")
    current_score: int = Field(..., ge=0, le=100, description="Current skill level")
    initial_score: int = Field(..., ge=0, le=100, description="Initial skill level")
    improvement: int = Field(..., description="Score improvement")
    articles_count: int = Field(..., description="Number of articles in this area")


class WriterProgress(BaseModel):
    """Writer improvement tracking"""
    writer_id: str = Field(..., description="Writer user ID")
    writer_name: str = Field(..., description="Writer display name")
    total_submissions: int = Field(default=0, description="Total articles submitted")
    approved_submissions: int = Field(default=0, description="Approved articles")
    average_score: float = Field(default=0.0, description="Average overall score")
    score_trend: List[int] = Field(default_factory=list, description="Score history (last 10)")
    skill_areas: List[WriterSkillArea] = Field(default_factory=list, description="Skill area breakdown")
    common_issues: Dict[str, int] = Field(default_factory=dict, description="Frequency of issue types")
    improvement_rate: float = Field(default=0.0, description="Score improvement per article")
    last_submission: Optional[datetime] = Field(None)
    joined_at: datetime = Field(default_factory=datetime.now)


class TeamAnalytics(BaseModel):
    """Team-wide analytics for managers"""
    total_writers: int = Field(..., description="Total number of writers")
    active_writers: int = Field(..., description="Writers active in last 30 days")
    total_submissions: int = Field(..., description="Total submissions")
    pending_review: int = Field(..., description="Submissions pending review")
    average_team_score: float = Field(..., description="Team average score")
    top_performers: List[Dict[str, Any]] = Field(default_factory=list, description="Top performing writers")
    improvement_leaders: List[Dict[str, Any]] = Field(default_factory=list, description="Most improved writers")
    common_team_issues: Dict[str, int] = Field(default_factory=dict, description="Most common issues across team")
    average_review_time: float = Field(..., description="Average review time in hours")


# ===================================
# API Response Models
# ===================================

class APIResponse(BaseModel):
    """Standard API response"""
    success: bool = Field(..., description="Whether request was successful")
    message: str = Field(..., description="Response message")
    data: Optional[Any] = Field(None, description="Response data")
    error: Optional[str] = Field(None, description="Error message if failed")
