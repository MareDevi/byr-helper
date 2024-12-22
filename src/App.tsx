import { useEffect } from "react";
import { useLocation } from 'react-router-dom';
import { IStaticMethods } from "preline/preline";
import LoginPage from "./pages/login_page";
import AppPage from "./pages/app_page";
import "preline/preline";
import "./App.css";
import { AuthProvider, useAuth } from './AuthContext';

declare global {
  interface Window {
    HSStaticMethods: IStaticMethods;
  }
}

function App() {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    window.HSStaticMethods.autoInit();
  }, [location.pathname]);

  if (isLoading) {
    return <div>Loading...</div>; // 显示加载状态
  }

  return (
    <main>
      {!isAuthenticated && <LoginPage />}
      {isAuthenticated && <AppPage /> }
    </main>
  );
}

export default function RootApp() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}