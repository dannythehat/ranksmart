"""
Content Manager API Routes

FastAPI routes for content submission, review, and writer analytics.
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
import uuid
from datetime import datetime

from src.core.schemas import (
    ContentSubmission,
    WriterProgress,
    TeamAnalytics,
    APIResponse,
    SubmissionStatus
)
from src.agents.content_manager import ContentManagerAgent, WriterAnalysisAgent
from src.config import get_settings

router = APIRouter(prefix="/api/content-manager", tags=["Content Manager"])

# Initialize agents
settings = get_settings()
manager_agent = ContentManagerAgent(gemini_api_key=settings.GEMINI_API_KEY)
writer_agent = WriterAnalysisAgent()

# In-memory storage (replace with database in production)
submissions_db: dict[str, ContentSubmission] = {}
writers_db: dict[str, List[ContentSubmission]] = {}


@router.post("/submit", response_model=APIResponse)
async def submit_content(
    writer_id: str,
    writer_name: str,
    title: str,
    content: str,
    content_format: str = "markdown"
):
    """
    Submit new content for review.
    
    Args:
        writer_id: Writer's unique ID
        writer_name: Writer's display name
        title: Article title
        content: Article content
        content_format: Content format (markdown/html)
    
    Returns:
        APIResponse with submission details
    """
    try:
        # Create submission
        submission = ContentSubmission(
            submission_id=str(uuid.uuid4()),
            writer_id=writer_id,
            writer_name=writer_name,
            title=title,
            content=content,
            content_format=content_format,
            status=SubmissionStatus.PENDING_REVIEW
        )
        
        # Store submission
        submissions_db[submission.submission_id] = submission
        
        # Track by writer
        if writer_id not in writers_db:
            writers_db[writer_id] = []
        writers_db[writer_id].append(submission)
        
        return APIResponse(
            success=True,
            message="Content submitted successfully",
            data={
                "submission_id": submission.submission_id,
                "status": submission.status.value,
                "created_at": submission.created_at.isoformat()
            }
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/review/{submission_id}", response_model=APIResponse)
async def review_submission(
    submission_id: str,
    target_keywords: Optional[List[str]] = None,
    jurisdiction: Optional[str] = None
):
    """
    Review a content submission and generate scores/feedback.
    
    Args:
        submission_id: Submission ID to review
        target_keywords: Optional target keywords for SEO
        jurisdiction: Optional jurisdiction for compliance
    
    Returns:
        APIResponse with review results
    """
    try:
        # Get submission
        submission = submissions_db.get(submission_id)
        if not submission:
            raise HTTPException(status_code=404, detail="Submission not found")
        
        # Review submission
        reviewed_submission = await manager_agent.review_submission(
            submission,
            target_keywords,
            jurisdiction
        )
        
        # Update storage
        submissions_db[submission_id] = reviewed_submission
        
        return APIResponse(
            success=True,
            message="Review completed successfully",
            data={
                "submission_id": reviewed_submission.submission_id,
                "status": reviewed_submission.status.value,
                "scores": {
                    "overall": reviewed_submission.scores.overall_score,
                    "seo": reviewed_submission.scores.seo_score,
                    "eeat": reviewed_submission.scores.eeat_score,
                    "quality": reviewed_submission.scores.content_quality,
                    "compliance": reviewed_submission.scores.compliance_score
                },
                "issues_count": len(reviewed_submission.annotations),
                "critical_issues": sum(1 for a in reviewed_submission.annotations if a.severity.value == "critical")
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/submission/{submission_id}", response_model=APIResponse)
async def get_submission(submission_id: str):
    """Get detailed submission information"""
    
    submission = submissions_db.get(submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    return APIResponse(
        success=True,
        message="Submission retrieved successfully",
        data=submission.dict()
    )


@router.post("/apply-fixes/{submission_id}", response_model=APIResponse)
async def apply_fixes(
    submission_id: str,
    annotation_ids: List[str]
):
    """
    Apply AI-suggested fixes to content.
    
    Args:
        submission_id: Submission ID
        annotation_ids: List of annotation IDs to apply
    
    Returns:
        APIResponse with updated content
    """
    try:
        submission = submissions_db.get(submission_id)
        if not submission:
            raise HTTPException(status_code=404, detail="Submission not found")
        
        # Apply fixes
        updated_content = await manager_agent.apply_fixes(submission, annotation_ids)
        
        # Update submission
        submission.content = updated_content
        submission.updated_at = datetime.now()
        submissions_db[submission_id] = submission
        
        return APIResponse(
            success=True,
            message=f"Applied {len(annotation_ids)} fixes successfully",
            data={
                "submission_id": submission_id,
                "fixes_applied": len(annotation_ids),
                "updated_content": updated_content[:500] + "..."  # Preview
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/writer/{writer_id}/progress", response_model=APIResponse)
async def get_writer_progress(writer_id: str):
    """
    Get writer progress and analytics.
    
    Args:
        writer_id: Writer's unique ID
    
    Returns:
        APIResponse with writer progress data
    """
    try:
        # Get writer's submissions
        writer_submissions = writers_db.get(writer_id, [])
        
        if not writer_submissions:
            raise HTTPException(status_code=404, detail="Writer not found")
        
        # Calculate progress
        writer_name = writer_submissions[0].writer_name
        progress = writer_agent.calculate_writer_progress(
            writer_id,
            writer_name,
            writer_submissions
        )
        
        # Get insights
        insights = writer_agent.get_writer_insights(progress)
        
        return APIResponse(
            success=True,
            message="Writer progress retrieved successfully",
            data={
                "progress": progress.dict(),
                "insights": insights
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/team/analytics", response_model=APIResponse)
async def get_team_analytics():
    """
    Get team-wide analytics for managers.
    
    Returns:
        APIResponse with team analytics
    """
    try:
        # Get all submissions
        all_submissions = list(submissions_db.values())
        
        # Calculate progress for all writers
        all_writers = []
        for writer_id, submissions in writers_db.items():
            if submissions:
                writer_name = submissions[0].writer_name
                progress = writer_agent.calculate_writer_progress(
                    writer_id,
                    writer_name,
                    submissions
                )
                all_writers.append(progress)
        
        # Generate team analytics
        analytics = writer_agent.generate_team_analytics(all_submissions, all_writers)
        
        return APIResponse(
            success=True,
            message="Team analytics retrieved successfully",
            data=analytics.dict()
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/submissions", response_model=APIResponse)
async def list_submissions(
    status: Optional[str] = None,
    writer_id: Optional[str] = None,
    limit: int = 20
):
    """
    List submissions with optional filters.
    
    Args:
        status: Filter by status (pending_review, in_review, etc.)
        writer_id: Filter by writer ID
        limit: Maximum number of results
    
    Returns:
        APIResponse with list of submissions
    """
    try:
        submissions = list(submissions_db.values())
        
        # Apply filters
        if status:
            submissions = [s for s in submissions if s.status.value == status]
        
        if writer_id:
            submissions = [s for s in submissions if s.writer_id == writer_id]
        
        # Sort by most recent
        submissions.sort(key=lambda x: x.created_at, reverse=True)
        
        # Limit results
        submissions = submissions[:limit]
        
        return APIResponse(
            success=True,
            message=f"Found {len(submissions)} submissions",
            data={
                "submissions": [
                    {
                        "submission_id": s.submission_id,
                        "writer_name": s.writer_name,
                        "title": s.title,
                        "status": s.status.value,
                        "overall_score": s.scores.overall_score if s.scores else None,
                        "created_at": s.created_at.isoformat()
                    }
                    for s in submissions
                ],
                "total": len(submissions)
            }
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
