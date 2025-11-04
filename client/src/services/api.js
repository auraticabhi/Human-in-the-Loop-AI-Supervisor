import axios from 'axios';

const API_URL = import.meta.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Help Requests API
export const requestsAPI = {
  // Get all pending requests
  getPending: async () => {
    const response = await api.get('/requests/pending');
    return response.data;
  },
  
  // Get resolved requests
  getResolved: async (limit = 50) => {
    const response = await api.get(`/requests/resolved?limit=${limit}`);
    return response.data;
  },
  
  // Get single request
  getById: async (id) => {
    const response = await api.get(`/requests/${id}`);
    return response.data;
  },
  
  // Resolve a request
  resolve: async (id, answer, supervisorId = 'supervisor-1') => {
    const response = await api.put(`/requests/${id}/resolve`, {
      answer,
      supervisorId,
    });
    return response.data;
  },
  
  // Get stats
  getStats: async () => {
    const response = await api.get('/requests/stats/overview');
    return response.data;
  },
};

// Knowledge Base API
export const knowledgeAPI = {
  // Get all knowledge entries
  getAll: async () => {
    const response = await api.get('/knowledge');
    return response.data;
  },
  
  // Get learned entries only
  getLearned: async () => {
    const response = await api.get('/knowledge/learned');
    return response.data;
  },
  
  // Add new knowledge
  add: async (question, answer, category = 'general') => {
    const response = await api.post('/knowledge', {
      question,
      answer,
      category,
    });
    return response.data;
  },
  
  // Update knowledge entry
  update: async (id, data) => {
    const response = await api.put(`/knowledge/${id}`, data);
    return response.data;
  },
  
  // Delete knowledge entry
  delete: async (id) => {
    const response = await api.delete(`/knowledge/${id}`);
    return response.data;
  },
};

export default api;