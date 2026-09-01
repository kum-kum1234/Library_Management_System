import React from 'react';

import {
  createContext,
  useContext,
  useState
} from 'react';

import api from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {

  const [user, setUser] = useState(() => {

    const stored =
      localStorage.getItem('library_user');

    try {
      return stored
        ? JSON.parse(stored)
        : null;
    }
    catch {
      return null;
    }
  });

  const login = async (credentials) => {

    const response = await api.post(
      '/login',
      credentials
    );

    const {
      id,
      token,
      username,
      role
    } = response.data;

    localStorage.setItem(
      'library_token',
      token
    );

    const userData = { id, username, role };
    localStorage.setItem('library_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {

    localStorage.removeItem(
      'library_token'
    );

    localStorage.removeItem(
      'library_user'
    );

    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}