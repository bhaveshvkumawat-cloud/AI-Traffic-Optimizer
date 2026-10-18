const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, { headers: { 'Content-Type': 'application/json' }, ...options });
  if (!response.ok) throw new Error(`API ${response.status}`);
  return response.json();
}
export const api = {
  health: () => request('/api/health'),
  decide: (payload) => request('/api/traffic/decide', { method: 'POST', body: JSON.stringify(payload) }),
  train: (payload) => request('/api/train', { method: 'POST', body: JSON.stringify(payload) }),
  history: () => request('/api/training/history')
};
