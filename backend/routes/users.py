from fastapi import APIRouter, Depends, HTTPException
from typing import List
from uuid import UUID

from database import users_repo
from models import User, UserCreate

router = APIRouter()

@router.post("/", response_model=User)
async def create_user(user: UserCreate):
    """Create a new user"""
    try:
        user_data = {
            "name": user.name,
            "username": user.username,
            "email": user.email,
            "password": user.password
        }
        result = await users_repo.create(user_data)
        return User(**result)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{user_id}", response_model=User)
async def get_user(user_id: UUID):
    """Get a specific user"""
    try:
        result = await users_repo.get_by_id(str(user_id), "id")
        
        if not result:
            raise HTTPException(status_code=404, detail="User not found")
        
        return User(**result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/username/{username}", response_model=User)
async def get_user_by_username(username: str):
    """Get a user by username"""
    try:
        users = await users_repo.get_all(filters={"username": username}, limit=1)
        
        if not users:
            raise HTTPException(status_code=404, detail="User not found")
        
        return User(**users[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) 