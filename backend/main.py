from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import mysql.connector
import crud
from models import Task, UserCreate, UserLogin
from auth import verify_password, create_access_token, verify_token
import os
from dotenv import load_dotenv

load_dotenv()

FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    user_id = verify_token(token)

    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = crud.get_user_by_id(user_id)

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user


@app.get("/me")
def get_me(current_user=Depends(get_current_user)):
    return {"email": current_user["email"], "id": current_user["id"]}


@app.get("/tasks")
def read_tasks(current_user=Depends(get_current_user)):
    return crud.get_tasks(current_user["id"])


@app.post("/tasks")
def add_task(task: Task, current_user=Depends(get_current_user)):
    if crud.task_title_exists(task.title, current_user["id"]):
        raise HTTPException(status_code=409, detail="A task with this name already exists")
    crud.create_task(task.title, current_user["id"])
    return {"message": "Task created"}


@app.put("/tasks/{task_id}")
def update_task(
    task_id: int,
    completed: bool,
    current_user=Depends(get_current_user),
):
    success = crud.update_task(task_id, completed, current_user["id"])
    if not success:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task updated"}


@app.delete("/tasks/{task_id}")
def delete_task(task_id: int, current_user=Depends(get_current_user)):
    success = crud.delete_task(task_id, current_user["id"])
    if not success:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted"}


@app.post("/signup", status_code=201)
def signup(user: UserCreate):
    if crud.get_user_by_email(user.email):
        raise HTTPException(status_code=409, detail="Email already registered")
    try:
        crud.create_user(user.email, user.password)
    except mysql.connector.Error:
        raise HTTPException(status_code=500, detail="Could not create user")
    return {"message": "User created"}


@app.post("/login")
def login(user: UserLogin):
    db_user = crud.get_user_by_email(user.email)

    if not db_user or not verify_password(user.password, db_user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"user_id": db_user["id"]})
    return {"access_token": token, "token_type": "bearer"}