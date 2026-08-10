import api from './client';

export const fetchReportSummary = async (params = {}) => {
  const { data } = await api.get('/reports/summary', { params });
  return data;
};
