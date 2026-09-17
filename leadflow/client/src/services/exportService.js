import api from './api';

export const exportService = {
  downloadExport: async (type = 'leads', format = 'csv') => {
    const response = await api.get(`/export`, {
      params: { type, format },
      responseType: 'blob',
    });

    const isXlsx = format.toLowerCase() === 'xlsx';
    const mimeType = isXlsx
      ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      : 'text/csv';

    const blob = new Blob([response.data], { type: mimeType });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute(
      'download',
      `leadflow_${type}_${new Date().toISOString().split('T')[0]}.${format}`
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },
};

