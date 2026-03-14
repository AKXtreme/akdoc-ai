import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import documentReducer from './documentSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    documents: documentReducer,
  },
});
