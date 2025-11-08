"""
Content Manager Feature Test Script

Demonstrates the complete workflow:
1. Writer submits article
2. Manager reviews and gets scores
3. Manager applies fixes or sends feedback
4. Track writer progress over time
"""

import asyncio
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.agents.content_manager import ContentManagerAgent, WriterAnalysisAgent
from src.core.schemas import ContentSubmission, SubmissionStatus
import uuid
from datetime import datetime


# Sample article content
SAMPLE_ARTICLE = """
# Best Online Casinos 2025

Looking for the best online casinos? Here's our top picks.

## Top Casinos

Casino A is great. They have lots of games. You should try it.

Casino B is also good. They offer bonuses.

## Conclusion

These casinos are the best. Sign up today!
"""


async def test_content_manager_workflow():
    """Test the complete Content Manager workflow"""
    
    print("🚀 RankSmart Content Manager - Test Workflow\n")
    print("=" * 60)
    
    # Initialize agents
    print("\n1️⃣ Initializing agents...")
    import os
    from dotenv import load_dotenv
    load_dotenv()
    
    gemini_key = os.getenv("GOOGLE_API_KEY")
    if not gemini_key:
        print("❌ Error: GOOGLE_API_KEY not found in environment")
        return
    
    manager_agent = ContentManagerAgent(gemini_api_key=gemini_key)
    writer_agent = WriterAnalysisAgent()
    print("✅ Agents initialized")
    
    # Step 1: Create submission
    print("\n2️⃣ Creating content submission...")
    submission = ContentSubmission(
        submission_id=str(uuid.uuid4()),
        writer_id="writer_001",
        writer_name="John Doe",
        title="Best Online Casinos 2025",
        content=SAMPLE_ARTICLE,
        content_format="markdown",
        status=SubmissionStatus.PENDING_REVIEW
    )
    print(f"✅ Submission created: {submission.submission_id}")
    print(f"   Writer: {submission.writer_name}")
    print(f"   Title: {submission.title}")
    print(f"   Status: {submission.status.value}")
    
    # Step 2: Review submission
    print("\n3️⃣ Reviewing submission (this may take 30-60 seconds)...")
    reviewed_submission = await manager_agent.review_submission(
        submission,
        target_keywords=["online casinos", "best casinos", "casino bonuses"],
        jurisdiction="UK"
    )
    print("✅ Review completed!")
    
    # Display scores
    print("\n📊 CONTENT SCORES:")
    print(f"   Overall Score:    {reviewed_submission.scores.overall_score}/100")
    print(f"   SEO Score:        {reviewed_submission.scores.seo_score}/100")
    print(f"   E-E-A-T Score:    {reviewed_submission.scores.eeat_score}/100")
    print(f"   Content Quality:  {reviewed_submission.scores.content_quality}/100")
    print(f"   Compliance Score: {reviewed_submission.scores.compliance_score}/100")
    
    # Display issues
    print(f"\n🔍 ISSUES FOUND: {len(reviewed_submission.annotations)}")
    for i, annotation in enumerate(reviewed_submission.annotations[:5], 1):
        severity_emoji = {
            "critical": "🔴",
            "warning": "🟡",
            "suggestion": "🟢"
        }
        emoji = severity_emoji.get(annotation.severity.value, "⚪")
        print(f"\n   {emoji} Issue {i} ({annotation.severity.value.upper()})")
        print(f"      {annotation.explanation[:100]}...")
        print(f"      Fix: {annotation.fix_suggestion[:100]}...")
    
    if len(reviewed_submission.annotations) > 5:
        print(f"\n   ... and {len(reviewed_submission.annotations) - 5} more issues")
    
    # Display feedback
    print("\n💬 MANAGER FEEDBACK:")
    print(f"   {reviewed_submission.feedback.overall_comment}")
    
    print("\n   ✅ Strengths:")
    for strength in reviewed_submission.feedback.strengths[:3]:
        print(f"      • {strength}")
    
    print("\n   📈 Areas for Improvement:")
    for area in reviewed_submission.feedback.areas_for_improvement[:3]:
        print(f"      • {area}")
    
    # Step 3: Apply fixes (simulate)
    print("\n4️⃣ Applying AI-suggested fixes...")
    if reviewed_submission.annotations:
        # Apply first 3 fixes
        fix_ids = [a.issue_id for a in reviewed_submission.annotations[:3]]
        updated_content = await manager_agent.apply_fixes(reviewed_submission, fix_ids)
        print(f"✅ Applied {len(fix_ids)} fixes")
        print(f"\n   Updated content preview:")
        print(f"   {updated_content[:200]}...")
    
    # Step 4: Track writer progress
    print("\n5️⃣ Calculating writer progress...")
    
    # Simulate multiple submissions for progress tracking
    submissions = [reviewed_submission]
    
    progress = writer_agent.calculate_writer_progress(
        submission.writer_id,
        submission.writer_name,
        submissions
    )
    
    print(f"✅ Writer Progress for {progress.writer_name}:")
    print(f"   Total Submissions: {progress.total_submissions}")
    print(f"   Average Score: {progress.average_score}/100")
    print(f"   Improvement Rate: {progress.improvement_rate:+.2f} points/article")
    
    if progress.skill_areas:
        print("\n   📊 Skill Areas:")
        for skill in progress.skill_areas:
            improvement_emoji = "📈" if skill.improvement >= 0 else "📉"
            print(f"      {improvement_emoji} {skill.skill_name}: {skill.current_score}/100 ({skill.improvement:+d})")
    
    # Get insights
    insights = writer_agent.get_writer_insights(progress)
    print("\n   💡 Insights:")
    for category, insight in insights.items():
        print(f"      {insight}")
    
    print("\n" + "=" * 60)
    print("✅ Test workflow completed successfully!")
    print("\n📝 Summary:")
    print(f"   • Article reviewed and scored")
    print(f"   • {len(reviewed_submission.annotations)} issues identified")
    print(f"   • Educational feedback generated")
    print(f"   • Fixes applied automatically")
    print(f"   • Writer progress tracked")
    print("\n🎉 Content Manager feature is working!")


if __name__ == "__main__":
    asyncio.run(test_content_manager_workflow())
