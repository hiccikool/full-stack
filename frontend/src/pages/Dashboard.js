import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://127.0.0.1:8000";

function ConfirmModal({ taskTitle, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h2 className="modal-heading">Delete task?</h2>
        <p className="modal-body">
          Are you sure you want to delete <strong>"{taskTitle}"</strong>? This cannot be undone.
        </p>
        <div className="modal-actions">
          <button className="modal-cancel-btn" onClick={onCancel}>Cancel</button>
          <button className="delete-btn" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [taskError, setTaskError] = useState("");
  const [confirmTask, setConfirmTask] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  useEffect(() => {
    fetchUser();
    fetchTasks();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch(`${API}/me`, { headers: authHeaders });
      if (!res.ok) return;
      const data = await res.json();
      setUserEmail(data.email);
    } catch {
      // silently fail — email display is non-critical
    }
  };

  const fetchTasks = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/tasks`, { headers: authHeaders });
      if (res.status === 401) { logout(); return; }
      const data = await res.json();
      setTasks(data);
    } catch {
      setError("Could not load tasks. Is the server running?");
    } finally {
      setLoading(false);
    }
  };

  const addTask = async () => {
    setTaskError("");
    if (!title.trim()) {
      setTaskError("Please enter a task name");
      return;
    }
    try {
      const res = await fetch(`${API}/tasks`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ title }),
      });
      if (res.status === 409) {
        setTaskError("A task with this name already exists");
        return;
      }
      if (!res.ok) return;
      setTitle("");
      setTaskError("");
      fetchTasks();
    } catch {
      setError("Could not add task");
    }
  };

  const toggleTask = async (task) => {
    try {
      const res = await fetch(
        `${API}/tasks/${task.id}?completed=${!task.completed}`,
        { method: "PUT", headers: authHeaders }
      );
      if (!res.ok) return;
      setTasks((prev) =>
        prev.map((t) => t.id === task.id ? { ...t, completed: !t.completed } : t)
      );
    } catch {
      setError("Could not update task");
    }
  };

  const handleDeleteClick = (task) => setConfirmTask(task);

  const confirmDelete = async () => {
    if (!confirmTask) return;
    const id = confirmTask.id;
    setConfirmTask(null);
    try {
      const res = await fetch(`${API}/tasks/${id}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      if (!res.ok) return;
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch {
      setError("Could not delete task");
    }
  };

  const cancelDelete = () => setConfirmTask(null);

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") addTask();
  };

  return (
    <div className="container">
      {confirmTask && (
        <ConfirmModal
          taskTitle={confirmTask.title}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}

      <div style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
        <h1 style={{ flex: 1, margin: 0 }}>My tasks</h1>
        <button className="logout-btn" onClick={logout}>Logout</button>
      </div>

      {userEmail && (
        <p style={{
          fontSize: 13,
          color: "#6b7280",
          marginBottom: 20,
          marginTop: 4,
        }}>
          Logged in as <strong>{userEmail}</strong>
        </p>
      )}

      {error && <p className="error-msg">{error}</p>}

      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            value={title}
            placeholder="Enter a task…"
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              marginBottom: 0,
              borderColor: taskError ? "#ef4444" : undefined,
            }}
          />
          <button className="primary-btn" onClick={addTask}>Add</button>
        </div>
        {taskError && <p className="field-error">{taskError}</p>}
      </div>

      {loading ? (
        <p style={{ textAlign: "center", color: "#888" }}>Loading tasks…</p>
      ) : tasks.length === 0 ? (
        <p style={{ textAlign: "center", color: "#888" }}>No tasks yet. Add one above!</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {tasks.map((task) => (
            <li key={task.id} className="task-item">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTask(task)}
                />
                <span
                  className="task-title"
                  style={{
                    textDecoration: task.completed ? "line-through" : "none",
                    opacity: task.completed ? 0.5 : 1,
                  }}
                >
                  {task.title}
                </span>
              </div>
              <button
                className="delete-btn"
                onClick={() => handleDeleteClick(task)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Dashboard;