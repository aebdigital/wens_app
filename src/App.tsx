import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ContactsProvider } from './contexts/ContactsContext';
import { ThemeProvider } from './contexts/ThemeContext';
import AuthWrapper from './components/AuthWrapper';
import Spis from './components/Spis';
import Objednavky from './components/Objednavky';
import Kontakty from './components/Kontakty';
import Nastavenia from './components/Nastavenia';
import Zamestnanci from './components/Zamestnanci';
import Layout from './components/layout/Layout';

const AppContent: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <AuthWrapper />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Spis />} />
        <Route path="/spis" element={<Spis />} />
        <Route path="/objednavky" element={<Objednavky />} />
        <Route path="/kontakty" element={<Kontakty />} />
        <Route path="/zamestnanci" element={<Zamestnanci />} />
        <Route path="/nastavenia" element={<Nastavenia />} />
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
            <AppContent />
          </ContactsProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
