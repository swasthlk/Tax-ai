
import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router';
import Login from './pages/Login';
import CitizenDashboard from './pages/CitizenDashboard';
import OfficialDashboard from './pages/OfficialDashboard';
import TaxTypeDetail from './pages/TaxTypeDetail';
import AIChat from './components/AIChat';
import { AppUser } from './types';
import { INITIAL_TAX_DATA } from './constants';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  theme: 'dark' | 'light';
  login: (userData: AppUser) => void;
  logout: () => void;
  updateUser: (updates: Partial<AppUser>) => void;
  toggleTheme: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

const App: React.FC = () => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>(
    (localStorage.getItem('taxwatch_theme') as 'dark' | 'light') || 'dark'
  );

  useEffect(() => {
    // Initialize session
    const savedUser = localStorage.getItem('taxwatch_active_session');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    // Initialize Global Tax Data
    const existingTaxData = localStorage.getItem('taxwatch_tax_data');
    if (!existingTaxData) {
      localStorage.setItem('taxwatch_tax_data', JSON.stringify(INITIAL_TAX_DATA));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    // Apply theme class to body
    if (theme === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
    localStorage.setItem('taxwatch_theme', theme);
  }, [theme]);

  const login = (userData: AppUser) => {
    setUser(userData);
    localStorage.setItem('taxwatch_active_session', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('taxwatch_active_session');
  };

  const updateUser = (updates: Partial<AppUser>) => {
    if (!user) return;
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('taxwatch_active_session', JSON.stringify(updatedUser));

    const allUsers = JSON.parse(localStorage.getItem('taxwatch_users') || '[]');
    const userIndex = allUsers.findIndex((u: any) => u.uid === user.uid);
    if (userIndex !== -1) {
      allUsers[userIndex] = { ...allUsers[userIndex], ...updates };
      localStorage.setItem('taxwatch_users', JSON.stringify(allUsers));
    }
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  if (loading) return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#0a1929]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00d4ff]"></div>
    </div>
  );

  return (
    <AuthContext.Provider value={{ user, loading, theme, login, logout, updateUser, toggleTheme }}>
      <HashRouter>
        <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0a1929]' : 'bg-[#f8fafc]'} text-gray-200`}>
          <Routes>
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
            <Route 
              path="/" 
              element={
                user ? (
                  user.role === 'citizen' ? <CitizenDashboard /> : <OfficialDashboard />
                ) : (
                  <Navigate to="/login" />
                )
              } 
            />
            <Route path="/tax/:type" element={user ? <TaxTypeDetail /> : <Navigate to="/login" />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
          {user && <AIChat />}
        </div>
      </HashRouter>
    </AuthContext.Provider>
  );
};

export default App;
