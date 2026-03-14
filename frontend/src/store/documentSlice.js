import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export const fetchDocuments = createAsyncThunk('documents/fetch', async (params, { rejectWithValue }) => {
  try {
    const res = await api.get('/documents/', { params });
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.detail || 'Failed to fetch documents');
  }
});

export const fetchDocumentById = createAsyncThunk('documents/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const res = await api.get(`/documents/${id}`);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.detail || 'Document not found');
  }
});

export const uploadDocument = createAsyncThunk('documents/upload', async (formData, { rejectWithValue }) => {
  try {
    const res = await api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.detail || 'Upload failed');
  }
});

export const reviewDocument = createAsyncThunk('documents/review', async ({ id, corrections }, { rejectWithValue }) => {
  try {
    const res = await api.put(`/documents/${id}/review`, corrections);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.detail || 'Review submission failed');
  }
});

export const deleteDocument = createAsyncThunk('documents/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/documents/${id}`);
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.detail || 'Delete failed');
  }
});

export const updateTags = createAsyncThunk('documents/updateTags', async ({ id, tags }, { rejectWithValue }) => {
  try {
    const res = await api.put(`/documents/${id}/tags`, tags);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.detail || 'Failed to update tags');
  }
});

// Silent versions — no loading spinner, used for polling
export const silentFetchDocumentById = createAsyncThunk('documents/silentFetchOne', async (id) => {
  const res = await api.get(`/documents/${id}`);
  return res.data;
});

export const silentFetchDocuments = createAsyncThunk('documents/silentFetch', async (params) => {
  const res = await api.get('/documents/', { params });
  return res.data;
});

export const fetchAnalytics = createAsyncThunk('documents/analytics', async (_, { rejectWithValue }) => {
  try {
    const [summary, trends] = await Promise.all([
      api.get('/analytics/summary'),
      api.get('/analytics/monthly-trends'),
    ]);
    return { summary: summary.data, trends: trends.data };
  } catch (err) {
    return rejectWithValue(err.response?.data?.detail || 'Failed to load analytics');
  }
});

const documentSlice = createSlice({
  name: 'documents',
  initialState: {
    list: [],
    total: 0,
    current: null,
    analytics: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearCurrent(state) { state.current = null; },
    clearError(state) { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDocuments.pending, (s) => { s.loading = true; })
      .addCase(fetchDocuments.fulfilled, (s, a) => { s.loading = false; s.list = a.payload.documents; s.total = a.payload.total; })
      .addCase(fetchDocuments.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(fetchDocumentById.pending, (s) => { s.loading = true; })
      .addCase(fetchDocumentById.fulfilled, (s, a) => { s.loading = false; s.current = a.payload; })
      .addCase(fetchDocumentById.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(uploadDocument.fulfilled, (s, a) => { s.list.unshift(a.payload); s.total += 1; })
      .addCase(reviewDocument.fulfilled, (s, a) => { s.current = a.payload; })
      .addCase(deleteDocument.fulfilled, (s, a) => { s.list = s.list.filter((d) => d.id !== a.payload); s.total -= 1; })
      .addCase(fetchAnalytics.fulfilled, (s, a) => { s.analytics = a.payload; })
      .addCase(silentFetchDocumentById.fulfilled, (s, a) => { s.current = a.payload; })
      .addCase(silentFetchDocuments.fulfilled, (s, a) => { s.list = a.payload.documents; s.total = a.payload.total; })
      .addCase(updateTags.fulfilled, (s, a) => {
        s.current = a.payload;
        const idx = s.list.findIndex((d) => d.id === a.payload.id);
        if (idx !== -1) s.list[idx] = a.payload;
      });
  },
});

export const { clearCurrent, clearError } = documentSlice.actions;
export default documentSlice.reducer;
