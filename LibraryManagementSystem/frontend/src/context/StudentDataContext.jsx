import React, { createContext, useContext } from 'react';
import useStudentData from '../hooks/useStudentData';

const StudentDataContext = createContext(null);

export function StudentDataProvider({ children }) {
  const value = useStudentData();
  return (
    <StudentDataContext.Provider value={value}>
      {children}
    </StudentDataContext.Provider>
  );
}

export function useStudent() {
  const ctx = useContext(StudentDataContext);
  if (!ctx) throw new Error('useStudent must be used within StudentDataProvider');
  return ctx;
}
