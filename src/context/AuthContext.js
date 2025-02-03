import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/config';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userSession, setUserSession] = useState(null);

  useEffect(() => {
    checkUserSession();
  }, []);

  const checkUserSession = async () => {
    try {
      const sessionData = await AsyncStorage.getItem('userSession');
      if (sessionData) {
        setUserSession(JSON.parse(sessionData));
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${username}`);
      const userData = await response.json();
      
      const sessionData = {
        username: userData.username,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phoneNumber: userData.phoneNumber,
      };
      
      await AsyncStorage.setItem('userSession', JSON.stringify(sessionData));
      setUserSession(sessionData);
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('userSession');
      setUserSession(null);
      return true;
    } catch (error) {
      console.error('Error removing session:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ isLoading, userSession, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 