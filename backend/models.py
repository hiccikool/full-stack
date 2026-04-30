# backend/models.py

from pydantic import BaseModel, EmailStr, Field

class Task(BaseModel):
    title: str
    completed: bool = False

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)

class UserLogin(BaseModel):
    email: str
    password: str