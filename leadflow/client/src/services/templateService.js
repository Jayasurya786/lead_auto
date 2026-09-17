import api from './api';

export const templateService = {
  getTemplates: async () => {
    const res = await api.get('/templates');
    return res.data;
  },

  getTemplateById: async (id) => {
    const res = await api.get(`/templates/${id}`);
    return res.data;
  },

  createTemplate: async (data) => {
    const res = await api.post('/templates', data);
    return res.data;
  },

  updateTemplate: async (id, data) => {
    const res = await api.put(`/templates/${id}`, data);
    return res.data;
  },

  deleteTemplate: async (id) => {
    const res = await api.delete(`/templates/${id}`);
    return res.data;
  },

  duplicateTemplate: async (id) => {
    const res = await api.post(`/templates/${id}/duplicate`);
    return res.data;
  },

  previewTemplate: async (data) => {
    const res = await api.post('/templates/preview', data);
    return res.data;
  },
};

