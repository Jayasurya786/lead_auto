import api from './api';

export const followUpService = {
  getFollowUps: async () => {
    const res = await api.get('/follow-ups');
    return res.data;
  },

  sendFollowUp: async (leadId, data) => {
    const res = await api.post(`/follow-ups/${leadId}/send`, data);
    return res.data;
  },

  reschedule: async (leadId, data) => {
    const res = await api.put(`/follow-ups/${leadId}/reschedule`, data);
    return res.data;
  },
};

