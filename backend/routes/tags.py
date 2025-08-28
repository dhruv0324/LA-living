from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from uuid import UUID

from database import SupabaseRepository
from models import Tag, TagCreate

router = APIRouter()

# Initialize repository
tags_repo = SupabaseRepository("tags")

@router.post("/", response_model=Tag)
async def create_tag(tag: TagCreate):
    """Create a new tag or return existing one if it already exists"""
    try:
        # Check if tag already exists for this user and type
        existing_tags = await tags_repo.get_filtered({
            "user_id": str(tag.user_id),
            "name": tag.name,
            "type": tag.type
        }, limit=1)
        
        if existing_tags:
            # Return existing tag
            return Tag(**existing_tags[0])
        
        # Create new tag
        tag_data = {
            "user_id": str(tag.user_id),
            "name": tag.name,
            "type": tag.type
        }
        result = await tags_repo.create(tag_data)
        return Tag(**result)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=List[Tag])
async def get_tags(
    user_id: UUID,
    type: Optional[str] = Query(None, description="Filter by tag type"),
    search: Optional[str] = Query(None, description="Search tags by name")
):
    """Get tags for a user with optional filtering"""
    try:
        filters = {"user_id": str(user_id)}
        if type:
            filters["type"] = type
        
        results = await tags_repo.get_filtered(filters, limit=1000)
        
        # Apply search filter if provided
        if search:
            search_lower = search.lower()
            results = [tag for tag in results if search_lower in tag.get('name', '').lower()]
        
        # Sort by name
        results.sort(key=lambda x: x.get('name', '').lower())
        
        return [Tag(**tag) for tag in results]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{tag_id}", response_model=Tag)
async def get_tag(tag_id: UUID):
    """Get a specific tag"""
    try:
        result = await tags_repo.get_by_id(str(tag_id), "tag_id")
        if not result:
            raise HTTPException(status_code=404, detail="Tag not found")
        return Tag(**result)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{tag_id}", response_model=Tag)
async def update_tag(tag_id: UUID, tag_update: TagCreate):
    """Update a tag"""
    try:
        update_data = {
            "name": tag_update.name,
            "type": tag_update.type
        }
        result = await tags_repo.update(str(tag_id), update_data, "tag_id")
        if not result:
            raise HTTPException(status_code=404, detail="Tag not found")
        return Tag(**result)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{tag_id}")
async def delete_tag(tag_id: UUID):
    """Delete a tag (Note: This will set tag_id to null in related records)"""
    try:
        result = await tags_repo.delete(str(tag_id), "tag_id")
        if not result:
            raise HTTPException(status_code=404, detail="Tag not found")
        return {"message": "Tag deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/search/{user_id}")
async def search_tags(
    user_id: UUID,
    q: str = Query(..., description="Search query"),
    type: Optional[str] = Query(None, description="Filter by tag type"),
    limit: int = Query(10, ge=1, le=50)
):
    """Search tags by name with autocomplete functionality"""
    try:
        filters = {"user_id": str(user_id)}
        if type:
            filters["type"] = type
        
        results = await tags_repo.get_filtered(filters, limit=1000)
        
        # Search by name (case-insensitive, partial match)
        search_lower = q.lower()
        matching_tags = []
        
        for tag in results:
            tag_name = tag.get('name', '').lower()
            if search_lower in tag_name:
                # Prioritize exact matches and prefix matches
                if tag_name == search_lower:
                    priority = 0  # Exact match
                elif tag_name.startswith(search_lower):
                    priority = 1  # Prefix match
                else:
                    priority = 2  # Contains match
                
                matching_tags.append((priority, tag))
        
        # Sort by priority, then by name
        matching_tags.sort(key=lambda x: (x[0], x[1].get('name', '').lower()))
        
        # Return limited results
        results = [tag for _, tag in matching_tags[:limit]]
        return [Tag(**tag) for tag in results]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/types/{user_id}")
async def get_tag_types(user_id: UUID):
    """Get all tag types available for a user"""
    return {
        "types": [
            {"value": "Expense", "label": "Expense"},
            {"value": "Income", "label": "Income"},
            {"value": "InternalLoan", "label": "Internal Loan"},
            {"value": "ExternalLoan", "label": "External Loan"}
        ]
    }

# Helper function for other modules
async def get_or_create_debt_repayment_tag(user_id: str) -> str:
    """Get or create the 'Debt Repayment' tag for income"""
    try:
        # Check if tag already exists
        existing_tags = await tags_repo.get_filtered({
            "user_id": user_id,
            "name": "Debt Repayment",
            "type": "Income"
        }, limit=1)
        
        if existing_tags:
            return existing_tags[0]["tag_id"]
        
        # Create new tag
        tag_data = {
            "user_id": user_id,
            "name": "Debt Repayment",
            "type": "Income"
        }
        result = await tags_repo.create(tag_data)
        return result["tag_id"]
    except Exception as e:
        # Return None if tag creation fails
        return None 