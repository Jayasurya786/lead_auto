import api from './api';

export const gmailService = {
  getStatus: async () => {
    const res = await api.get('/gmail/status');
    return res.data;
  },

  getAuthUrl: async () => {
    const res = await api.get('/gmail/auth');
    return res.data;
  },

  disconnect: async () => {
    const res = await api.post('/gmail/disconnect');
    return res.data;
  },

  sendEmail: async (data) => {
    const res = await api.post('/gmail/send', data);
    return res.data;
  },

  sendBulk: async (data) => {
    const res = await api.post('/gmail/send-bulk', data);
    return res.data;
  },
};

