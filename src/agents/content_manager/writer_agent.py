"""
Writer Analysis Agent

Tracks writer progress, skill development, and improvement over time.
"""

from typing import List, Dict
from datetime import datetime, timedelta
from collections import Counter

from src.core.schemas import (
    ContentSubmission,
    WriterProgress,
    WriterSkillArea,
    TeamAnalytics,
    SubmissionStatus
)


class WriterAnalysisAgent:
    """
    AI agent that tracks writer improvement and generates analytics.
    
    Responsibilities:
    - Track writer progress over time
    - Identify skill areas and improvement trends
    - Generate team-wide analytics
    - Provide insights for managers
    """
    
    def __init__(self):
        """Initialize the Writer Analysis Agent"""
        pass
    
    def calculate_writer_progress(
        self,
        writer_id: str,
        writer_name: str,
        submissions: List[ContentSubmission]
    ) -> WriterProgress:
        """
        Calculate comprehensive writer progress metrics.
        
        Args:
            writer_id: Writer's unique ID
            writer_name: Writer's display name
            submissions: List of all submissions by this writer
        
        Returns:
            WriterProgress with detailed metrics
        """
        if not submissions:
            return WriterProgress(
                writer_id=writer_id,
                writer_name=writer_name,
                total_submissions=0,
                approved_submissions=0,
                average_score=0.0,
                score_trend=[],
                skill_areas=[],
                common_issues={},
                improvement_rate=0.0
            )
        
        # Sort by date
        sorted_submissions = sorted(submissions, key=lambda x: x.created_at)
        
        # Basic metrics
        total_submissions = len(submissions)
        approved_submissions = sum(
            1 for s in submissions 
            if s.status == SubmissionStatus.APPROVED
        )
        
        # Score trend (last 10 submissions)
        score_trend = [
            s.scores.overall_score 
            for s in sorted_submissions[-10:] 
            if s.scores
        ]
        
        # Average score
        scores = [s.scores.overall_score for s in submissions if s.scores]
        average_score = sum(scores) / len(scores) if scores else 0.0
        
        # Skill areas analysis
        skill_areas = self._analyze_skill_areas(sorted_submissions)
        
        # Common issues
        common_issues = self._identify_common_issues(submissions)
        
        # Improvement rate (score change per article)
        improvement_rate = self._calculate_improvement_rate(score_trend)
        
        # Last submission date
        last_submission = sorted_submissions[-1].created_at if submissions else None
        
        return WriterProgress(
            writer_id=writer_id,
            writer_name=writer_name,
            total_submissions=total_submissions,
            approved_submissions=approved_submissions,
            average_score=round(average_score, 1),
            score_trend=score_trend,
            skill_areas=skill_areas,
            common_issues=common_issues,
            improvement_rate=round(improvement_rate, 2),
            last_submission=last_submission
        )
    
    def _analyze_skill_areas(
        self,
        submissions: List[ContentSubmission]
    ) -> List[WriterSkillArea]:
        """Analyze performance in different skill areas"""
        
        if not submissions:
            return []
        
        # Track scores for each skill area
        seo_scores = []
        eeat_scores = []
        quality_scores = []
        compliance_scores = []
        
        for sub in submissions:
            if sub.scores:
                seo_scores.append(sub.scores.seo_score)
                eeat_scores.append(sub.scores.eeat_score)
                quality_scores.append(sub.scores.content_quality)
                compliance_scores.append(sub.scores.compliance_score)
        
        skill_areas = []
        
        # SEO Optimization
        if seo_scores:
            skill_areas.append(WriterSkillArea(
                skill_name="SEO Optimization",
                current_score=seo_scores[-1],
                initial_score=seo_scores[0],
                improvement=seo_scores[-1] - seo_scores[0],
                articles_count=len(seo_scores)
            ))
        
        # E-E-A-T
        if eeat_scores:
            skill_areas.append(WriterSkillArea(
                skill_name="E-E-A-T",
                current_score=eeat_scores[-1],
                initial_score=eeat_scores[0],
                improvement=eeat_scores[-1] - eeat_scores[0],
                articles_count=len(eeat_scores)
            ))
        
        # Content Quality
        if quality_scores:
            skill_areas.append(WriterSkillArea(
                skill_name="Content Quality",
                current_score=quality_scores[-1],
                initial_score=quality_scores[0],
                improvement=quality_scores[-1] - quality_scores[0],
                articles_count=len(quality_scores)
            ))
        
        # Compliance
        if compliance_scores:
            skill_areas.append(WriterSkillArea(
                skill_name="Compliance",
                current_score=compliance_scores[-1],
                initial_score=compliance_scores[0],
                improvement=compliance_scores[-1] - compliance_scores[0],
                articles_count=len(compliance_scores)
            ))
        
        return skill_areas
    
    def _identify_common_issues(
        self,
        submissions: List[ContentSubmission]
    ) -> Dict[str, int]:
        """Identify most common issues across submissions"""
        
        issue_counter = Counter()
        
        for sub in submissions:
            for annotation in sub.annotations:
                # Extract issue type from explanation
                issue_type = annotation.explanation.split(':')[0] if ':' in annotation.explanation else annotation.explanation[:50]
                issue_counter[issue_type] += 1
        
        # Return top 10 most common issues
        return dict(issue_counter.most_common(10))
    
    def _calculate_improvement_rate(self, score_trend: List[int]) -> float:
        """Calculate improvement rate (score change per article)"""
        
        if len(score_trend) < 2:
            return 0.0
        
        # Linear regression to find trend
        n = len(score_trend)
        x_mean = (n - 1) / 2
        y_mean = sum(score_trend) / n
        
        numerator = sum((i - x_mean) * (score - y_mean) for i, score in enumerate(score_trend))
        denominator = sum((i - x_mean) ** 2 for i in range(n))
        
        if denominator == 0:
            return 0.0
        
        slope = numerator / denominator
        return slope
    
    def generate_team_analytics(
        self,
        all_submissions: List[ContentSubmission],
        all_writers: List[WriterProgress]
    ) -> TeamAnalytics:
        """
        Generate team-wide analytics for managers.
        
        Args:
            all_submissions: All submissions across the team
            all_writers: Progress data for all writers
        
        Returns:
            TeamAnalytics with team-wide metrics
        """
        
        # Active writers (submitted in last 30 days)
        thirty_days_ago = datetime.now() - timedelta(days=30)
        active_writers = sum(
            1 for w in all_writers 
            if w.last_submission and w.last_submission > thirty_days_ago
        )
        
        # Pending review count
        pending_review = sum(
            1 for s in all_submissions 
            if s.status == SubmissionStatus.PENDING_REVIEW
        )
        
        # Average team score
        all_scores = [
            s.scores.overall_score 
            for s in all_submissions 
            if s.scores
        ]
        average_team_score = sum(all_scores) / len(all_scores) if all_scores else 0.0
        
        # Top performers (by average score)
        top_performers = sorted(
            [
                {
                    "writer_id": w.writer_id,
                    "writer_name": w.writer_name,
                    "average_score": w.average_score,
                    "total_submissions": w.total_submissions
                }
                for w in all_writers
            ],
            key=lambda x: x["average_score"],
            reverse=True
        )[:5]
        
        # Improvement leaders (by improvement rate)
        improvement_leaders = sorted(
            [
                {
                    "writer_id": w.writer_id,
                    "writer_name": w.writer_name,
                    "improvement_rate": w.improvement_rate,
                    "total_submissions": w.total_submissions
                }
                for w in all_writers
                if w.improvement_rate > 0
            ],
            key=lambda x: x["improvement_rate"],
            reverse=True
        )[:5]
        
        # Common team issues
        all_issues = Counter()
        for sub in all_submissions:
            for annotation in sub.annotations:
                issue_type = annotation.explanation.split(':')[0] if ':' in annotation.explanation else annotation.explanation[:50]
                all_issues[issue_type] += 1
        common_team_issues = dict(all_issues.most_common(10))
        
        # Average review time
        review_times = []
        for sub in all_submissions:
            if sub.reviewed_at and sub.created_at:
                delta = sub.reviewed_at - sub.created_at
                review_times.append(delta.total_seconds() / 3600)  # Convert to hours
        average_review_time = sum(review_times) / len(review_times) if review_times else 0.0
        
        return TeamAnalytics(
            total_writers=len(all_writers),
            active_writers=active_writers,
            total_submissions=len(all_submissions),
            pending_review=pending_review,
            average_team_score=round(average_team_score, 1),
            top_performers=top_performers,
            improvement_leaders=improvement_leaders,
            common_team_issues=common_team_issues,
            average_review_time=round(average_review_time, 1)
        )
    
    def get_writer_insights(self, progress: WriterProgress) -> Dict[str, str]:
        """
        Generate human-readable insights about a writer's progress.
        
        Args:
            progress: Writer progress data
        
        Returns:
            Dictionary of insight categories and messages
        """
        insights = {}
        
        # Overall performance
        if progress.average_score >= 85:
            insights["performance"] = "🌟 Excellent! Consistently high-quality work."
        elif progress.average_score >= 70:
            insights["performance"] = "👍 Good work! Room for improvement in some areas."
        else:
            insights["performance"] = "📈 Keep learning! Significant improvement needed."
        
        # Improvement trend
        if progress.improvement_rate > 2:
            insights["trend"] = "🚀 Rapid improvement! Great learning progress."
        elif progress.improvement_rate > 0:
            insights["trend"] = "📈 Steady improvement over time."
        elif progress.improvement_rate < -1:
            insights["trend"] = "⚠️ Declining scores. May need additional support."
        else:
            insights["trend"] = "➡️ Stable performance."
        
        # Strongest skill
        if progress.skill_areas:
            strongest = max(progress.skill_areas, key=lambda x: x.current_score)
            insights["strength"] = f"💪 Strongest in: {strongest.skill_name} ({strongest.current_score}/100)"
        
        # Area for improvement
        if progress.skill_areas:
            weakest = min(progress.skill_areas, key=lambda x: x.current_score)
            insights["improvement_area"] = f"🎯 Focus on: {weakest.skill_name} ({weakest.current_score}/100)"
        
        # Activity level
        if progress.last_submission:
            days_since = (datetime.now() - progress.last_submission).days
            if days_since < 7:
                insights["activity"] = "✅ Active writer"
            elif days_since < 30:
                insights["activity"] = "⏰ Moderately active"
            else:
                insights["activity"] = "⚠️ Inactive - last submission over 30 days ago"
        
        return insights
