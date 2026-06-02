import React, { createContext, useContext } from 'react';
import useLibraryData from '../hooks/useLibraryData';
import { useAuth } from './AuthContext';

const LibraryDataContext = createContext(null);

export function LibraryDataProvider({ children }) {
  const { user } = useAuth();
  const value = useLibraryData({ includeUsers: user?.role === 'admin' });
  return (
    <LibraryDataContext.Provider value={value}>
      {children}
    </LibraryDataContext.Provider>
  );
}

export function useLibrary() {
  const ctx = useContext(LibraryDataContext);
  if (!ctx) {
    throw new Error('useLibrary must be used within LibraryDataProvider');
  }
  return ctx;
}
