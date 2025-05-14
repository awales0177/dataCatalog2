from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from pydantic import BaseModel, Field
import json
import os
from typing import Dict, Any, List, Optional
import secrets

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

class PartialUpdate(BaseModel):
    path: str = Field(..., description="JSON path to update (e.g., 'models[0].name')")
    value: Any = Field(..., description="New value to set")

# File paths
JSON_FILES = {
    "dataAgreements": "data/dataAgreements.json",
    "domains": "data/dataDomains.json",
    "models": "data/dataModels.json",
    "specifications": "data/dataModels.json",  # Alias for specifications
    "theme": "data/theme.json",
    "menu": "data/menuItems.json",
    "applications": "data/applications.json",
    "lexicon": "data/lexicon.json",
    "reference": "data/reference.json"
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

def read_json_file(file_path: str) -> Dict:
    try:
        with open(file_path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File not found")
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Invalid JSON file")

def write_json_file(file_path: str, data: Dict):
    try:
        with open(file_path, 'w') as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def get_item_count(file_name: str) -> int:
    """
    Get the count of items in a specific data file.
    
    Parameters:
    - file_name: The name of the file to count items from
    
    Returns:
    - Number of items in the file
    """
    if file_name not in JSON_FILES:
        raise HTTPException(status_code=404, detail="File not found")
    
    data = read_json_file(JSON_FILES[file_name])
    key = DATA_TYPE_KEYS.get(file_name)
    
    if not key or key not in data:
        raise HTTPException(status_code=500, detail=f"Invalid data structure for {file_name}")
    
    return len(data[key])

@app.get(
    "/api/count/{file_name}",
    response_model=ItemCount,
    summary="Get item count",
    description="Get the number of items in a specific data file",
    responses={
        200: {
            "description": "Successfully retrieved item count",
            "content": {
                "application/json": {
                    "example": {"count": 10}
                }
            }
        },
        404: {"description": "File not found"},
        500: {"description": "Internal server error"}
    }
)
async def get_count(file_name: str):
    """
    Get the count of items in a specific data file.
    
    Parameters:
    - file_name: The name of the file to count items from (contracts, domains, models, applications, lexicon, or reference)
    
    Returns:
    - Object containing the count of items
    """
    count = get_item_count(file_name)
    return {"count": count}

# Public endpoints
@app.get(
    "/api/{file_name}",
    response_model=Dict[str, Any],
    summary="Get JSON file content",
    description="Retrieve the content of a specific JSON file by its name",
    responses={
        200: {
            "description": "Successfully retrieved file content",
            "content": {
                "application/json": {
                    "example": {
                        "models": [
                            {
                                "id": 1,
                                "name": "Example Model",
                                "description": "This is an example model"
                            }
                        ]
                    }
                }
            }
        },
        404: {"description": "File not found"},
        500: {"description": "Internal server error"}
    }
)
async def get_json_file(file_name: str):
    """
    Retrieve the content of a specific JSON file.
    
    Parameters:
    - file_name: The name of the file to retrieve (contracts, domains, models, theme, or menu)
    
    Returns:
    - JSON content of the requested file
    """
    if file_name not in JSON_FILES:
        raise HTTPException(status_code=404, detail="File not found")
    return read_json_file(JSON_FILES[file_name])

@app.get(
    "/api/{file_name}/paginated",
    response_model=Dict[str, Any],
    summary="Get paginated JSON file content",
    description="Retrieve paginated content of a specific JSON file"
)
async def get_paginated_json_file(
    file_name: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100)
):
    """Get paginated content of a JSON file."""
    if file_name not in JSON_FILES:
        raise HTTPException(status_code=404, detail="File not found")
    
    data = read_json_file(JSON_FILES[file_name])
    key = DATA_TYPE_KEYS.get(file_name)
    
    if not key or key not in data:
        raise HTTPException(status_code=500, detail=f"Invalid data structure for {file_name}")
    
    return get_paginated_data(data, key, page, page_size)

# Admin endpoints
@app.put(
    "/api/admin/{file_name}",
    response_model=Dict[str, str],
    summary="Update JSON file content",
    description="Update the content of a specific JSON file (requires admin authentication)",
    responses={
        200: {
            "description": "Successfully updated file",
            "content": {
                "application/json": {
                    "example": {"message": "File updated successfully"}
                }
            }
        },
        401: {"description": "Unauthorized - Invalid credentials"},
        404: {"description": "File not found"},
        500: {"description": "Internal server error"}
    }
)
async def update_json_file(
    file_name: str,
    data: JSONData,
    credentials: HTTPBasicCredentials = Depends(verify_credentials)
):
    """
    Update the content of a specific JSON file.
    
    Parameters:
    - file_name: The name of the file to update (contracts, domains, models, theme, or menu)
    - data: The new JSON data to store
    
    Returns:
    - Success message
    """
    if file_name not in JSON_FILES:
        raise HTTPException(status_code=404, detail="File not found")
    write_json_file(JSON_FILES[file_name], data.data)
    return {"message": "File updated successfully"}

@app.patch(
    "/api/admin/{file_name}/partial",
    response_model=Dict[str, str],
    summary="Partially update JSON file",
    description="Update a specific path in the JSON file (requires admin authentication)"
)
async def partial_update_json_file(
    file_name: str,
    update: PartialUpdate,
    credentials: HTTPBasicCredentials = Depends(verify_credentials)
):
    """Update a specific path in the JSON file."""
    if file_name not in JSON_FILES:
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        data = read_json_file(JSON_FILES[file_name])
        updated_data = update_json_path(data, update.path, update.value)
        write_json_file(JSON_FILES[file_name], updated_data)
        return {"message": "File updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get(
    "/api/admin/files",
    response_model=FileList,
    summary="List available files",
    description="Get a list of all available JSON files (requires admin authentication)",
    responses={
        200: {
            "description": "Successfully retrieved file list",
            "content": {
                "application/json": {
                    "example": {
                        "files": ["contracts", "domains", "models", "theme", "menu"]
                    }
                }
            }
        },
        401: {"description": "Unauthorized - Invalid credentials"}
    }
)
async def list_files(credentials: HTTPBasicCredentials = Depends(verify_credentials)):
    """
    Get a list of all available JSON files.
    
    Returns:
    - List of available file names
    """
    return {"files": list(JSON_FILES.keys())}

@app.get(
    "/api/agreements/by-model/{model_short_name}",
    response_model=Dict[str, Any],
    summary="Get agreements by model",
    description="Retrieve all agreements associated with a specific data model by its short name",
    responses={
        200: {
            "description": "Successfully retrieved agreements",
            "content": {
                "application/json": {
                    "example": {
                        "model": {
                            "id": 1,
                            "shortName": "PROD",
                            "name": "Product Catalog"
                        },
                        "agreements": [
                            {
                                "id": "contract-001",
                                "name": "Product Data Schema",
                                "description": "Schema validation for product data"
                            }
                        ]
                    }
                }
            }
        },
        404: {"description": "Model not found"},
        500: {"description": "Internal server error"}
    }
)
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 