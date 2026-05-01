# backend/crud.py

from database import get_connection
from auth import hash_password


def get_tasks(user_id):
    conn = get_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT * FROM tasks WHERE user_id = %s",
            (user_id,)
        )
        return cursor.fetchall()
    finally:
        conn.close()


def get_all_tasks():
    """Supervisor only: get every task across all users."""
    conn = get_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT tasks.*, users.email AS user_email
            FROM tasks
            JOIN users ON tasks.user_id = users.id
            ORDER BY tasks.user_id, tasks.id
        """)
        return cursor.fetchall()
    finally:
        conn.close()


def get_task_by_id(task_id):
    """Fetch a single task regardless of owner (used for supervisor checks)."""
    conn = get_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM tasks WHERE id = %s", (task_id,))
        return cursor.fetchone()
    finally:
        conn.close()


def task_title_exists(title, user_id):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id FROM tasks WHERE title = %s AND user_id = %s",
            (title, user_id)
        )
        return cursor.fetchone() is not None
    finally:
        conn.close()


def create_task(title, user_id):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO tasks (title, user_id) VALUES (%s, %s)",
            (title, user_id)
        )
        conn.commit()
    finally:
        conn.close()


def update_task(task_id, completed, user_id):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE tasks SET completed = %s WHERE id = %s AND user_id = %s",
            (completed, task_id, user_id)
        )
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()


def update_task_any(task_id, completed):
    """Supervisor only: update any task regardless of owner."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE tasks SET completed = %s WHERE id = %s",
            (completed, task_id)
        )
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()


def delete_task(task_id, user_id):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "DELETE FROM tasks WHERE id = %s AND user_id = %s",
            (task_id, user_id)
        )
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()


def delete_task_any(task_id):
    """Supervisor only: delete any task regardless of owner."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM tasks WHERE id = %s", (task_id,))
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()


def create_user(email, password, role="user"):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        password_hash = hash_password(password)
        cursor.execute(
            "INSERT INTO users (email, password_hash, role) VALUES (%s, %s, %s)",
            (email, password_hash, role)
        )
        conn.commit()
    finally:
        conn.close()


def get_user_by_email(email):
    conn = get_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        return cursor.fetchone()
    finally:
        conn.close()


def get_user_by_id(user_id):
    conn = get_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        return cursor.fetchone()
    finally:
        conn.close()


def get_all_users():
    """Supervisor only: list all users."""
    conn = get_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, email, role FROM users ORDER BY id")
        return cursor.fetchall()
    finally:
        conn.close()