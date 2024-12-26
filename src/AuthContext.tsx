import React, { createContext, useContext, useState, useEffect } from 'react';
import { readTextFile, BaseDirectory } from '@tauri-apps/plugin-fs';

interface AuthContextType {
  isAuthenticated: boolean;
  authInfo: string[];
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authInfo, setAuthInfo] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAuthInfo() {
      try {
        const auth_json = await readTextFile('auth.json', {
          baseDir: BaseDirectory.AppData,
        });
        
        const authData = JSON.parse(auth_json);
        const result = [
          authData.blade,
          authData.tenant_id,
          authData.user_id,
          authData.auth_token,
          authData.account,
          authData.ucloud_password,
          authData.jwxt_password
        ];
        
        setAuthInfo(result);
        setIsAuthenticated(true);
      } catch (err: any) {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAuthInfo();
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, authInfo, isLoading }}>
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