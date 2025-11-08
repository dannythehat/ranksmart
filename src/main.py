"""
RankSmart 2.0 - Main Application Entry Point

This is the main entry point for the RankSmart application.
It initializes the FastAPI server with Content Manager routes.
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from loguru import logger
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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

# Create FastAPI app
app = FastAPI(
    title="RankSmart 2.0",
    description="AI-Powered SEO Content Optimizer with Content Manager",
    version="2.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to RankSmart 2.0",
        "version": "2.0.0",
        "features": [
            "Content Manager & Writer Learning System",
            "E-E-A-T Scoring",
            "SEO Optimization",
            "Compliance Checking"
        ]
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "version": "2.0.0"}


def main():
    """Main application entry point."""
    logger.info("🚀 Starting RankSmart 2.0...")
    
    # Check required environment variables
    required_vars = ["GOOGLE_API_KEY"]
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        logger.error(f"❌ Missing required environment variables: {', '.join(missing_vars)}")
        logger.info("💡 Please copy .env.example to .env and add your API keys")
        sys.exit(1)
    
    try:
        # Import and register routes
        from src.api.content_manager_routes import router as content_manager_router
        app.include_router(content_manager_router)
        
        logger.info("✅ Environment configured successfully")
        logger.info("✅ Content Manager routes registered")
        logger.info("🌐 Starting FastAPI server...")
        
        # Start server
        uvicorn.run(
            app,
            host="0.0.0.0",
            port=8000,
            log_level="info"
        )
        
    except ImportError as e:
        logger.error(f"❌ Failed to import routes: {e}")
        logger.info("💡 Make sure all dependencies are installed: pip install -r requirements.txt")
        sys.exit(1)
    except Exception as e:
        logger.error(f"❌ Failed to start application: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
