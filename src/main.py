"""
RankSmart 2.0 - Main Application Entry Point

This is the main entry point for the RankSmart application.
It initializes the web server and starts the dashboard.
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from loguru import logger

# Add src directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

# Load environment variables
load_dotenv()

# Configure logging
logger.add(
    "logs/ranksmart.log",
    rotation="500 MB",
    retention="10 days",
    level=os.getenv("LOG_LEVEL", "INFO")
)


def main():
    """Main application entry point."""
    logger.info("🚀 Starting RankSmart 2.0...")
    
    # Check required environment variables
    required_vars = ["GOOGLE_API_KEY", "FIRECRAWL_API_KEY"]
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        logger.error(f"❌ Missing required environment variables: {', '.join(missing_vars)}")
        logger.info("💡 Please copy .env.example to .env and add your API keys")
        sys.exit(1)
    
    # Import and start the UI
    try:
        from ui.dashboard.app import start_dashboard
        logger.info("✅ Environment configured successfully")
        logger.info("🌐 Starting web dashboard...")
        start_dashboard()
    except ImportError as e:
        logger.error(f"❌ Failed to import dashboard: {e}")
        logger.info("💡 Make sure all dependencies are installed: pip install -r requirements.txt")
        sys.exit(1)
    except Exception as e:
        logger.error(f"❌ Failed to start application: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
