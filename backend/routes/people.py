from fastapi import APIRouter, HTTPException
from typing import List
from uuid import UUID

from database import SupabaseRepository
from models import Person, PersonCreate

router = APIRouter()
people_repo = SupabaseRepository("people")

@router.post("/", response_model=Person)
async def create_person(person: PersonCreate):
    """Create a new person"""
    try:
        person_data = {
            "user_id": str(person.user_id),
            "name": person.name,
        }
        
        result = await people_repo.create(person_data)
        return Person(**result)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=List[Person])
async def get_people(user_id: UUID):
    """Get all people for a user"""
    try:
        filters = {"user_id": str(user_id)}
        results = await people_repo.get_filtered(filters, 100)
        
        # Sort by name
        results.sort(key=lambda x: x.get('name', '').lower())
        
        return [Person(**result) for result in results]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{person_id}", response_model=Person)
async def get_person(person_id: UUID):
    """Get a specific person"""
    try:
        result = await people_repo.get_by_id(str(person_id), "person_id")
        if not result:
            raise HTTPException(status_code=404, detail="Person not found")
        
        return Person(**result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{person_id}", response_model=Person)
async def update_person(person_id: UUID, person_update: PersonCreate):
    """Update a person"""
    try:
        update_data = {
            "name": person_update.name,
        }
        
        result = await people_repo.update(str(person_id), update_data, "person_id")
        return Person(**result)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{person_id}")
async def delete_person(person_id: UUID):
    """Delete a person and all associated debts"""
    try:
        success = await people_repo.delete(str(person_id), "person_id")
        if not success:
            raise HTTPException(status_code=404, detail="Person not found")
        
        return {"message": "Person deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) 