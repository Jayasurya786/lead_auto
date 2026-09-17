import api from './api';

export const importService = {
  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/imports', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  getImports: async (params = {}) => {
    const res = await api.get('/imports', { params });
    return res.data;
  },

  getImportById: async (id) => {
    const res = await api.get(`/imports/${id}`);
    return res.data;
  },
};

