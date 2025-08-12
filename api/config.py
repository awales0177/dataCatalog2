import os
from datetime import timedelta

# Environment-based configuration
class Config:
    # Test mode - uses local _data files instead of GitHub
    TEST_MODE = os.getenv('TEST_MODE', 'false').lower() == 'true'
    
    # Passthrough mode - bypasses cache and fetches directly from GitHub
    PASSTHROUGH_MODE = os.getenv('PASSTHROUGH_MODE', 'false').lower() == 'true'
    
    # GitHub configuration (only used when not in test mode)
    GITHUB_RAW_BASE_URL = os.getenv('GITHUB_RAW_BASE_URL', 'https://raw.githubusercontent.com/awales0177/test_data/main')
    
    # Cache configuration
    CACHE_DURATION = timedelta(minutes=int(os.getenv('CACHE_DURATION_MINUTES', '15')))
    
    # Server configuration
    HOST = os.getenv('HOST', '0.0.0.0')
    PORT = int(os.getenv('PORT', '8000'))
    
    # Authentication
    ADMIN_USERNAME = os.getenv('ADMIN_USERNAME', 'admin')
    ADMIN_PASSWORD = os.getenv('ADMIN_PASSWORD', 'admin')
    
    # Logging
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    
    @classmethod
    def get_mode_description(cls):
        """Get a human-readable description of the current mode."""
        if cls.TEST_MODE:
            return "TEST MODE - Using local _data files"
        elif cls.PASSTHROUGH_MODE:
            return "PASSTHROUGH MODE - Direct GitHub access (no cache)"
        else:
            return "CACHED MODE - GitHub with caching"
    
    @classmethod
    def get_data_source(cls):
        """Get the current data source."""
        if cls.TEST_MODE:
            return "local"
        elif cls.PASSTHROUGH_MODE:
            return "github"
        else:
            return "cached_github"
