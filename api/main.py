from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from pydantic import BaseModel, Field
import json
import os
from typing import Dict, Any, List, Optional
import secrets
import requests
from datetime import datetime, timedelta
import logging
import threading
import time
from time import perf_counter

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Performance metrics
performance_metrics = {
    "requests": {
        "total": 0,
        "by_endpoint": {},
        "response_times": []
    },
    "cache": {
        "hits": 0,
        "misses": 0
    },
    "github": {
        "requests": 0,
        "errors": 0,
        "response_times": []
    }
}

def log_performance(endpoint: str, start_time: float, cache_hit: bool = None, github_request: bool = False):
    """Log performance metrics for an API request."""
    duration = perf_counter() - start_time
    performance_metrics["requests"]["total"] += 1
    performance_metrics["requests"]["by_endpoint"][endpoint] = performance_metrics["requests"]["by_endpoint"].get(endpoint, 0) + 1
    performance_metrics["requests"]["response_times"].append(duration)
    
    if cache_hit is not None:
        if cache_hit:
            performance_metrics["cache"]["hits"] += 1
        else:
            performance_metrics["cache"]["misses"] += 1
    
    if github_request:
        performance_metrics["github"]["requests"] += 1
        performance_metrics["github"]["response_times"].append(duration)

def get_performance_stats():
    """Calculate performance statistics."""
    response_times = performance_metrics["requests"]["response_times"]
    github_times = performance_metrics["github"]["response_times"]
    
    stats = {
        "total_requests": performance_metrics["requests"]["total"],
        "requests_by_endpoint": performance_metrics["requests"]["by_endpoint"],
        "cache": {
            "hits": performance_metrics["cache"]["hits"],
            "misses": performance_metrics["cache"]["misses"],
            "hit_rate": performance_metrics["cache"]["hits"] / (performance_metrics["cache"]["hits"] + performance_metrics["cache"]["misses"]) if (performance_metrics["cache"]["hits"] + performance_metrics["cache"]["misses"]) > 0 else 0
        },
        "github": {
            "total_requests": performance_metrics["github"]["requests"],
            "errors": performance_metrics["github"]["errors"]
        }
    }
    
    if response_times:
        stats["response_times"] = {
            "avg": sum(response_times) / len(response_times),
            "min": min(response_times),
            "max": max(response_times),
            "p95": sorted(response_times)[int(len(response_times) * 0.95)]
        }
    
    if github_times:
        stats["github"]["response_times"] = {
            "avg": sum(github_times) / len(github_times),
            "min": min(github_times),
            "max": max(github_times),
            "p95": sorted(github_times)[int(len(github_times) * 0.95)]
        }
    
    return stats

# API Documentation
app = FastAPI(
    title="Catalog API",
    description="""
    API for serving and managing catalog JSON files. This API provides endpoints for:
    
    * Retrieving data models, contracts, domains, theme, and menu items
    * Managing data through an admin interface
    * Real-time updates to the catalog
    
    ## Authentication
    Admin endpoints require basic authentication with the following credentials:
    * Username: admin
    * Password: admin
    
    ## Data Structure
    The API serves the following data types:
    * Models: Data model definitions and metadata
    * Contracts: Product agreements and compliance
    * Domains: Data domains and their relationships
    * Theme: UI theme configuration
    * Menu: Navigation menu structure
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# GitHub configuration
GITHUB_RAW_BASE_URL = "https://raw.githubusercontent.com/awales0177/test_data/main"
CACHE_DURATION = timedelta(minutes=15)
PASSTHROUGH_MODE = False  # Can be toggled via environment variable

# Log server configuration
logger.info("=" * 50)
logger.info("Server Configuration:")
logger.info(f"Mode: {'PASSTHROUGH' if PASSTHROUGH_MODE else 'CACHED'}")
logger.info(f"Cache Duration: {CACHE_DURATION}")
logger.info(f"GitHub Base URL: {GITHUB_RAW_BASE_URL}")
logger.info("=" * 50)

# Cache storage
cache = {
    "data": {},
    "last_updated": {}
}

# Basic authentication
security = HTTPBasic()
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin"  # In production, use environment variables

def verify_credentials(credentials: HTTPBasicCredentials = Depends(security)):
    correct_username = secrets.compare_digest(credentials.username, ADMIN_USERNAME)
    correct_password = secrets.compare_digest(credentials.password, ADMIN_PASSWORD)
    if not (correct_username and correct_password):
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials

# Data models
class JSONData(BaseModel):
    data: Dict[str, Any] = Field(..., description="The JSON data to be stored")

class FileList(BaseModel):
    files: List[str] = Field(..., description="List of available file names")

class ItemCount(BaseModel):
    count: int = Field(..., description="Number of items in the data file")

class PaginationParams(BaseModel):
    page: int = Field(1, ge=1, description="Page number")
    page_size: int = Field(10, ge=1, le=100, description="Items per page")

# File paths mapping
JSON_FILES = {
    "dataAgreements": "dataAgreements.json",
    "domains": "dataDomains.json",
    "models": "dataModels.json",
    "specifications": "dataModels.json",  # Alias for specifications
    "theme": "theme.json",
    "applications": "applications.json",
    "lexicon": "lexicon.json",
    "reference": "reference.json"
}

# Data type to key mapping for counting items
DATA_TYPE_KEYS = {
    "dataAgreements": "agreements",
    "domains": "domains",
    "models": "models",
    "specifications": "models",  # Alias for specifications
    "applications": "applications",
    "lexicon": "terms",
    "reference": "items"
}

def fetch_from_github(file_name: str) -> Dict:
    """Fetch data from GitHub raw content."""
    start_time = perf_counter()
    if file_name not in JSON_FILES:
        logger.error(f"File {file_name} not found in JSON_FILES mapping")
        raise HTTPException(status_code=404, detail="File not found")
    
    url = f"{GITHUB_RAW_BASE_URL}/{JSON_FILES[file_name]}"
    logger.info(f"Fetching data from GitHub: {url}")
    try:
        response = requests.get(url)
        logger.info(f"GitHub response status: {response.status_code}")
        if response.status_code == 404:
            logger.error(f"File not found on GitHub: {url}")
            raise HTTPException(status_code=404, detail="File not found on GitHub")
        if response.status_code != 200:
            performance_metrics["github"]["errors"] += 1
            logger.error(f"GitHub API error: {response.status_code} - {response.text}")
            raise HTTPException(status_code=500, detail=f"GitHub API error: {response.status_code}")
        
        data = response.json()
        logger.info(f"Successfully fetched and parsed JSON for {file_name}")
        log_performance("github_fetch", start_time, github_request=True)
        return data
    except requests.exceptions.RequestException as e:
        performance_metrics["github"]["errors"] += 1
        logger.error(f"Network error fetching from GitHub: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Network error: {str(e)}")
    except json.JSONDecodeError as e:
        performance_metrics["github"]["errors"] += 1
        logger.error(f"Invalid JSON response from GitHub: {str(e)}")
        raise HTTPException(status_code=500, detail="Invalid JSON response from GitHub")
    except Exception as e:
        performance_metrics["github"]["errors"] += 1
        logger.error(f"Unexpected error fetching from GitHub: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

def cleanup_stale_cache():
    """Remove cache entries that are older than CACHE_DURATION."""
    current_time = datetime.now()
    stale_files = [
        file_name for file_name, last_updated in cache["last_updated"].items()
        if current_time - last_updated > CACHE_DURATION
    ]
    
    for file_name in stale_files:
        logger.info(f"Removing stale cache for {file_name}")
        del cache["data"][file_name]
        del cache["last_updated"][file_name]

def get_cached_data(file_name: str) -> Dict:
    """Get data from cache or fetch from GitHub if cache is expired."""
    start_time = perf_counter()
    current_time = datetime.now()
    logger.info(f"Getting cached data for {file_name}")
    
    # Clean up any stale cache entries
    cleanup_stale_cache()
    
    # Check if cache is expired or doesn't exist
    if (file_name not in cache["last_updated"] or 
        current_time - cache["last_updated"][file_name] > CACHE_DURATION or 
        file_name not in cache["data"]):
        
        logger.info(f"Cache miss or expired for {file_name}, fetching from GitHub")
        # Fetch fresh data from GitHub
        data = fetch_from_github(file_name)
        cache["data"][file_name] = data
        cache["last_updated"][file_name] = current_time
        logger.info(f"Cache updated for {file_name}")
        log_performance("cache_miss", start_time, cache_hit=False)
    else:
        logger.info(f"Cache hit for {file_name} (age: {current_time - cache['last_updated'][file_name]})")
        log_performance("cache_hit", start_time, cache_hit=True)
    
    return cache["data"][file_name]

@app.get("/api/{file_name}")
def get_json_file(file_name: str):
    """Get JSON file content with caching or passthrough mode."""
    start_time = perf_counter()
    logger.info(f"Request for {file_name} - Using {'passthrough' if PASSTHROUGH_MODE else 'cached'} mode")
    result = fetch_from_github(file_name) if PASSTHROUGH_MODE else get_cached_data(file_name)
    log_performance("get_json_file", start_time)
    return result

@app.get("/api/{file_name}/paginated")
def get_paginated_json_file(
    file_name: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100)
):
    """Get paginated JSON file content."""
    logger.info(f"Paginated request for {file_name} - Using {'passthrough' if PASSTHROUGH_MODE else 'cached'} mode")
    data = get_cached_data(file_name) if not PASSTHROUGH_MODE else fetch_from_github(file_name)
    key = DATA_TYPE_KEYS.get(file_name)
    
    if not key or key not in data:
        raise HTTPException(status_code=500, detail=f"Invalid data structure for {file_name}")
    
    items = data[key]
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    
    return {
        "items": items[start_idx:end_idx],
        "total": len(items),
        "page": page,
        "page_size": page_size,
        "total_pages": (len(items) + page_size - 1) // page_size
    }

@app.get("/api/count/{file_name}")
def get_count(file_name: str):
    """Get the count of items in a specific data file."""
    logger.info(f"Count request for {file_name} - Using {'passthrough' if PASSTHROUGH_MODE else 'cached'} mode")
    data = get_cached_data(file_name) if not PASSTHROUGH_MODE else fetch_from_github(file_name)
    key = DATA_TYPE_KEYS.get(file_name)
    
    if not key or key not in data:
        raise HTTPException(status_code=500, detail=f"Invalid data structure for {file_name}")
    
    return {"count": len(data[key])}

@app.get("/api/agreements/by-model/{model_short_name}")
async def get_agreements_by_model(model_short_name: str):
    """
    Get all agreements associated with a specific data model by its short name.
    
    Args:
        model_short_name (str): The short name of the model (e.g., 'CUST', 'PROD')
        
    Returns:
        dict: A dictionary containing the model info and filtered agreements
        
    Raises:
        HTTPException: If the model is not found
    """
    try:
        agreements_data = read_json_file(JSON_FILES['dataAgreements'])
        model_data = read_json_file(JSON_FILES['models'])

        # Find the model by short name (case-insensitive)
        model = next((m for m in model_data['models'] if m['shortName'].lower() == model_short_name.lower()), None)
        if not model:
            raise HTTPException(
                status_code=404, 
                detail=f"Model with short name '{model_short_name}' not found"
            )

        # Filter agreements by model shortName
        filtered_agreements = [
            agreement for agreement in agreements_data['agreements']
            if agreement.get('modelShortName', '').lower() == model_short_name.lower()
        ]
        
        return {
            "model": {
                "id": model['id'],
                "shortName": model['shortName'],
                "name": model['name']
            },
            "agreements": filtered_agreements
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing request: {str(e)}"
        )

def get_paginated_data(data: Dict, key: str, page: int, page_size: int) -> Dict:
    """Get paginated data from a dictionary."""
    items = data.get(key, [])
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    return {
        "items": items[start_idx:end_idx],
        "total": len(items),
        "page": page,
        "page_size": page_size,
        "total_pages": (len(items) + page_size - 1) // page_size
    }

def update_json_path(data: Dict, path: str, value: Any) -> Dict:
    """Update a specific path in the JSON data."""
    # Simple path implementation - could be enhanced with proper JSON path parsing
    parts = path.split('.')
    current = data
    for part in parts[:-1]:
        if '[' in part:
            key, idx = part.split('[')
            idx = int(idx.rstrip(']'))
            current = current[key][idx]
        else:
            current = current[part]
    
    last_part = parts[-1]
    if '[' in last_part:
        key, idx = last_part.split('[')
        idx = int(idx.rstrip(']'))
        current[key][idx] = value
    else:
        current[last_part] = value
    
    return data

def read_json_file(file_path: str) -> Dict:
    try:
        data_path = os.path.join('_data', file_path)
        logger.info(f"Reading JSON file from: {data_path}")
        with open(data_path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        logger.error(f"File not found: {data_path}")
        raise HTTPException(status_code=404, detail=f"File not found: {file_path}")
    except json.JSONDecodeError:
        logger.error(f"Invalid JSON file: {data_path}")
        raise HTTPException(status_code=500, detail=f"Invalid JSON file: {file_path}")
    except Exception as e:
        logger.error(f"Error reading file {data_path}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

def write_json_file(file_path: str, data: Dict):
    try:
        data_path = os.path.join('_data', file_path)
        logger.info(f"Writing JSON file to: {data_path}")
        with open(data_path, 'w') as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        logger.error(f"Error writing file {data_path}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Debug endpoints
@app.get("/api/debug/cache")
def get_cache_status():
    """Get the current status of the cache."""
    current_time = datetime.now()
    cache_status = {
        "total_files": len(cache["data"]),
        "files": {}
    }
    
    for file_name, last_updated in cache["last_updated"].items():
        age = current_time - last_updated
        cache_status["files"][file_name] = {
            "last_updated": last_updated.isoformat(),
            "age_seconds": age.total_seconds(),
            "is_stale": age > CACHE_DURATION
        }
    
    return cache_status

@app.get("/api/debug/performance")
def get_performance_metrics():
    """Get current performance metrics."""
    return get_performance_stats()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 