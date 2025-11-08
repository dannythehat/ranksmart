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
# API Response Models
# ===================================

class APIResponse(BaseModel):
    """Standard API response"""
    success: bool = Field(..., description="Whether request was successful")
    message: str = Field(..., description="Response message")
    data: Optional[Any] = Field(None, description="Response data")
    error: Optional[str] = Field(None, description="Error message if failed")
