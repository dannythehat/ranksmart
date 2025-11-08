"""
RankSmart 2.0 - Configuration Management

Centralized configuration for the entire application.
"""

import os
from pathlib import Path
from typing import Optional
from pydantic import BaseModel, Field


class APIConfig(BaseModel):
    """API Keys Configuration"""
    google_api_key: str = Field(..., description="Google Gemini API Key")
    firecrawl_api_key: str = Field(..., description="Firecrawl API Key")
    fal_api_key: Optional[str] = Field(None, description="Flux AI API Key")
    openai_api_key: Optional[str] = Field(None, description="OpenAI API Key")


class DatabaseConfig(BaseModel):
    """Database Configuration"""
    url: str = Field(default="sqlite:///./ranksmart.db", description="Database URL")


class AppConfig(BaseModel):
    """Application Configuration"""
    environment: str = Field(default="development", description="Environment")
    port: int = Field(default=8000, description="Application Port")
    secret_key: str = Field(..., description="Secret key for sessions")
    log_level: str = Field(default="INFO", description="Logging level")


class IntegrationConfig(BaseModel):
    """Integration Configuration"""
    slack_webhook_url: Optional[str] = None
    discord_webhook_url: Optional[str] = None
    wordpress_site_url: Optional[str] = None
    wordpress_username: Optional[str] = None
    wordpress_app_password: Optional[str] = None
    webflow_api_token: Optional[str] = None


class FeatureFlags(BaseModel):
    """Feature Flags"""
    enable_image_generation: bool = Field(default=True)
    enable_auto_fix: bool = Field(default=True)
    enable_bulk_scanning: bool = Field(default=False)
    enable_api_access: bool = Field(default=False)


class RateLimitConfig(BaseModel):
    """Rate Limiting Configuration"""
    per_minute: int = Field(default=60, description="Max requests per minute")
    max_concurrent_scans: int = Field(default=5, description="Max concurrent scans")


class Config:
    """Main Configuration Class"""
    
    def __init__(self):
        self.api = APIConfig(
            google_api_key=os.getenv("GOOGLE_API_KEY", ""),
            firecrawl_api_key=os.getenv("FIRECRAWL_API_KEY", ""),
            fal_api_key=os.getenv("FAL_API_KEY"),
            openai_api_key=os.getenv("OPENAI_API_KEY")
        )
        
        self.database = DatabaseConfig(
            url=os.getenv("DATABASE_URL", "sqlite:///./ranksmart.db")
        )
        
        self.app = AppConfig(
            environment=os.getenv("ENVIRONMENT", "development"),
            port=int(os.getenv("PORT", "8000")),
            secret_key=os.getenv("SECRET_KEY", "change-me-in-production"),
            log_level=os.getenv("LOG_LEVEL", "INFO")
        )
        
        self.integrations = IntegrationConfig(
            slack_webhook_url=os.getenv("SLACK_WEBHOOK_URL"),
            discord_webhook_url=os.getenv("DISCORD_WEBHOOK_URL"),
            wordpress_site_url=os.getenv("WORDPRESS_SITE_URL"),
            wordpress_username=os.getenv("WORDPRESS_USERNAME"),
            wordpress_app_password=os.getenv("WORDPRESS_APP_PASSWORD"),
            webflow_api_token=os.getenv("WEBFLOW_API_TOKEN")
        )
        
        self.features = FeatureFlags(
            enable_image_generation=os.getenv("ENABLE_IMAGE_GENERATION", "true").lower() == "true",
            enable_auto_fix=os.getenv("ENABLE_AUTO_FIX", "true").lower() == "true",
            enable_bulk_scanning=os.getenv("ENABLE_BULK_SCANNING", "false").lower() == "true",
            enable_api_access=os.getenv("ENABLE_API_ACCESS", "false").lower() == "true"
        )
        
        self.rate_limit = RateLimitConfig(
            per_minute=int(os.getenv("RATE_LIMIT_PER_MINUTE", "60")),
            max_concurrent_scans=int(os.getenv("MAX_CONCURRENT_SCANS", "5"))
        )
        
        # Create necessary directories
        self._create_directories()
    
    def _create_directories(self):
        """Create necessary directories if they don't exist"""
        directories = [
            "logs",
            "data",
            "exports",
            "temp"
        ]
        for directory in directories:
            Path(directory).mkdir(exist_ok=True)
    
    def validate(self) -> bool:
        """Validate configuration"""
        if not self.api.google_api_key:
            raise ValueError("GOOGLE_API_KEY is required")
        if not self.api.firecrawl_api_key:
            raise ValueError("FIRECRAWL_API_KEY is required")
        return True


# Global configuration instance
config = Config()
