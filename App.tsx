
import React, { useState, useEffect, createContext, useContext } from 'react';
// Fix: Use react-router instead of react-router-dom to match available exports in current environment
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
  login: (userData: AppUser) => void;
  logout: () => void;
  updateUser: (updates: Partial<AppUser>) => void;
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

  if (loading) return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#0a1929]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00d4ff]"></div>
    </div>
  );

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      <HashRouter>
        <div className="min-h-screen bg-[#0a1929] text-gray-200">
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
