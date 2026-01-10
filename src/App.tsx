import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ContactsProvider } from './contexts/ContactsContext';
import { SpisProvider } from './contexts/SpisContext';
import { TasksProvider } from './contexts/TasksContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProductsProvider } from './contexts/ProductsContext';
import { PermissionsProvider } from './contexts/PermissionsContext';
import { DocumentLockProvider } from './contexts/DocumentLockContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import AuthWrapper from './components/AuthWrapper';
import Spis from './components/Spis';
import Objednavky from './components/Objednavky';
import Kontakty from './components/Kontakty';
import Nastavenia from './components/Nastavenia';
import Zamestnanci from './components/Zamestnanci';
import Dovolenky from './components/Dovolenky';
import Ulohy from './components/Ulohy';
import Layout from './components/layout/Layout';
import { TaskPopup } from './components/tasks/TaskPopup';

const TaskListener: React.FC = () => {
  // This component will just mount the popup that listens to context
  return <TaskPopup />;
};

// Authenticated app with data providers - only mounted after successful login
const AuthenticatedApp: React.FC = () => {
  return (
    <PermissionsProvider>
      <DocumentLockProvider>
        <ContactsProvider>
          <SpisProvider>
            <TasksProvider>
              <ProductsProvider>
                <Layout>
                  <TaskListener />
                  <Routes>
                    <Route path="/" element={<Navigate to="/spis" replace />} />
                    <Route path="/login" element={<Navigate to="/spis" replace />} />
                    <Route path="/spis" element={<Spis />} />
                    <Route path="/objednavky" element={<Objednavky />} />
                    <Route path="/kontakty" element={<Kontakty />} />
                    <Route path="/zamestnanci" element={<Zamestnanci />} />
                    <Route path="/dovolenky" element={<Dovolenky />} />
                    <Route path="/nastavenia" element={<Nastavenia />} />
                    <Route path="/ulohy" element={<Ulohy />} />
                  </Routes>
                </Layout>
              </ProductsProvider>
            </TasksProvider>
          </SpisProvider>
        </ContactsProvider>
      </DocumentLockProvider>
    </PermissionsProvider>
  );
};

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking auth session
  if (isLoading) {
    return (
      <div className="h-[100dvh] bg-white flex items-center justify-center">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#e11b28]"></div>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!user) {
    // Redirect to /login if not already there
    if (location.pathname !== '/login') {
      return <Navigate to="/login" replace />;
    }
    return <AuthWrapper />;
  }

  // Show authenticated app with data providers
  return <AuthenticatedApp />;
};



function App() {
  return (
    <ErrorBoundary>
      <Router>
        <ThemeProvider>
          <AuthProvider>
            <Toaster position="top-right" />
            <AppContent />
          </AuthProvider>
        </ThemeProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
