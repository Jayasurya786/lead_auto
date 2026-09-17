import api from './api';

export const leadService = {
  getStats: async () => {
    const res = await api.get('/leads/stats');
    return res.data;
  },

  getLeads: async (params = {}) => {
    const res = await api.get('/leads', { params });
    return res.data;
  },

  getLeadById: async (id) => {
    const res = await api.get(`/leads/${id}`);
    return res.data;
  },

  createLead: async (data) => {
    const res = await api.post('/leads', data);
    return res.data;
  },

  updateLead: async (id, data) => {
    const res = await api.put(`/leads/${id}`, data);
    return res.data;
  },

  deleteLead: async (id) => {
    const res = await api.delete(`/leads/${id}`);
    return res.data;
  },

  addNote: async (id, content) => {
    const res = await api.post(`/leads/${id}/notes`, { content });
    return res.data;
  },

  bulkAction: async (leadIds, action, statusValue) => {
    const res = await api.post('/leads/bulk', { leadIds, action, statusValue });
    return res.data;
  },
};

