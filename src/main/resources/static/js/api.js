// Central place for all backend calls. Keeps JWT handling in one spot.
const API_BASE = '/api';

const Storage = {
  getToken: () => localStorage.getItem('quizapp_token'),
  setToken: (t) => localStorage.setItem('quizapp_token', t),
  clearToken: () => localStorage.removeItem('quizapp_token'),
  getUser: () => JSON.parse(localStorage.getItem('quizapp_user') || 'null'),
  setUser: (u) => localStorage.setItem('quizapp_user', JSON.stringify(u)),
  clearUser: () => localStorage.removeItem('quizapp_user'),
};

async function apiRequest(path, { method = 'GET', body = null, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = Storage.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(API_BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const message = (data && (data.error || data.message)) || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type}`;
  setTimeout(() => toast.classList.add('hidden'), 3000);
}
