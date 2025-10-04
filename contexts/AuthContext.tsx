import { jwtDecode } from 'jwt-decode';
import React, { createContext, useContext, useEffect, useState } from 'react';
import Auth0 from 'react-native-auth0';
import { auth0Config } from '../auth0-configuration';

const auth0 = new Auth0(auth0Config);

interface User {
  id: string;
  email: string;
  name?: string;
  picture?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const credentials = await auth0.credentialsManager.getCredentials();
      if (credentials?.accessToken) {
        const decoded = jwtDecode(credentials.accessToken) as any;
        const userInfo = await auth0.auth.userInfo({ token: credentials.accessToken });
        
        setUser({
          id: userInfo.sub || '',
          email: userInfo.email || '',
          name: userInfo.name,
          picture: userInfo.picture,
        });
      }
    } catch (error) {
      console.log('No valid credentials found');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async () => {
    try {
      setIsLoading(true);
      const credentials = await auth0.webAuth.authorize({
        scope: 'openid profile email',
      });

      await auth0.credentialsManager.saveCredentials(credentials);
      
      const userInfo = await auth0.auth.userInfo({ token: credentials.accessToken });
      
      setUser({
        id: userInfo.sub || '',
        email: userInfo.email || '',
        name: userInfo.name,
        picture: userInfo.picture,
      });

      // Store user in MongoDB
      await storeUserInDatabase(userInfo);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await auth0.webAuth.clearSession();
      await auth0.credentialsManager.clearCredentials();
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getAccessToken = async (): Promise<string | null> => {
    try {
      const credentials = await auth0.credentialsManager.getCredentials();
      return credentials?.accessToken || null;
    } catch (error) {
      console.error('Failed to get access token:', error);
      return null;
    }
  };

  const storeUserInDatabase = async (userInfo: any) => {
    try {
      const response = await fetch('http://localhost:3000/api/auth/store-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auth0Id: userInfo.sub,
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
        }),
      });

      if (!response.ok) {
        console.error('Failed to store user in database');
      }
    } catch (error) {
      console.error('Error storing user in database:', error);
    }
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        login,
        logout,
        getAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};