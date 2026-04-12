import API from '@/api/index.js';

/**
 * Submit a waste record for an event (agent only)
 */
export const submitWasteRecord = async (payload) => {
  const response = await API.post('/waste-records', payload);
  return response.data;
};

/**
 * Get waste submissions for authenticated agent
 */
export const getWasteSubmissions = async (page = 1, limit = 10) => {
  const response = await API.get('/waste-records/portal/submissions', {
    params: { page, limit },
  });
  return response.data;
};

/**
 * Get all waste records (admin only)
 */
export const getAllWasteRecords = async (page = 1, limit = 10) => {
  const response = await API.get('/waste-records', { params: { page, limit } });
  return response.data;
};

/**
 * Get waste record by ID
 */
export const getWasteRecordById = async (recordId) => {
  const response = await API.get(`/waste-records/${recordId}`);
  return response.data;
};

/**
 * Update waste record (if allowed)
 */
export const updateWasteRecord = async (recordId, updateData) => {
  const response = await API.put(`/waste-records/${recordId}`, updateData);
  return response.data;
};

/**
 * Delete waste record (soft delete by default)
 */
export const deleteWasteRecord = async (recordId) => {
  const response = await API.delete(`/waste-records/${recordId}`);
  return response.data;
};
