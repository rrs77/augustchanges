import React, { useState, useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { LoginForm } from './components/LoginForm';
import { LoadingSpinner } from './components/LoadingSpinner';
import { Footer } from './components/Footer';
import { useAuth } from './hooks/useAuth';
import { HelpGuide } from './components/HelpGuide';

function AppContent() {
  const { user, loading } = useAuth();
  const [showHelpGuide, setShowHelpGuide] = useState(true);
  const [helpGuideSection, setHelpGuideSection] = useState<'activity' | 'lesson' | 'unit' | 'assign' | undefined>(undefined);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  if (!user) {
    return <LoginForm />;
  }
  
  const handleOpenGuide = (section?: 'activity' | 'lesson' | 'unit' | 'assign') => {
    setHelpGuideSection(section);
    setShowHelpGuide(true);
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 pt-16">
        <Dashboard />
      </main>
      <Footer />
      <HelpGuide 
        isOpen={showHelpGuide} 
        onClose={() => setShowHelpGuide(false)} 
        initialSection={helpGuideSection}
      />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <DataProvider>
          <AppContent />
        </DataProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;