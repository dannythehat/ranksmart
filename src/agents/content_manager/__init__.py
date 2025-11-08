"""
Content Manager Agent

Handles content submission review, scoring, annotation, and writer feedback.
"""

from .manager_agent import ContentManagerAgent
from .writer_agent import WriterAnalysisAgent

__all__ = ["ContentManagerAgent", "WriterAnalysisAgent"]
