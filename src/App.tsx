import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ContactsProvider } from './contexts/ContactsContext';
import { TasksProvider, useTasks } from './contexts/TasksContext';
import { ThemeProvider } from './contexts/ThemeContext';
import AuthWrapper from './components/AuthWrapper';
import Spis from './components/Spis';
import Objednavky from './components/Objednavky';
import Kontakty from './components/Kontakty';
import Nastavenia from './components/Nastavenia';
import Zamestnanci from './components/Zamestnanci';
import Ulohy from './components/Ulohy';
import Layout from './components/layout/Layout';
import { TaskPopup } from './components/tasks/TaskPopup';

const TaskListener: React.FC = () => {
    // This component will just mount the popup that listens to context
    return <TaskPopup />;
};

const AppContent: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <AuthWrapper />;
  }

  return (
    <Layout>
      <TaskListener />
      <Routes>
        <Route path="/" element={<Navigate to="/spis" replace />} />
        <Route path="/spis" element={<Spis />} />
        <Route path="/objednavky" element={<Objednavky />} />
        <Route path="/kontakty" element={<Kontakty />} />
        <Route path="/zamestnanci" element={<Zamestnanci />} />
        <Route path="/nastavenia" element={<Nastavenia />} />
        <Route path="/ulohy" element={<Ulohy />} />
      </Routes>
    </Layout>
  );
};

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <ContactsProvider>
            <TasksProvider>
              <AppContent />
            </TasksProvider>
          </ContactsProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
