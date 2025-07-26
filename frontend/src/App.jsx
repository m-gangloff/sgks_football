import React, { useState, useEffect } from 'react';
import { Box, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import NavBar from './components/NavBar';
import PlayersPage from './pages/PlayersPage';
import MatchesPage from './pages/MatchesPage';
import BackupManager from './components/BackupManager';
import LoginModal from './components/LoginModal';

function App() {
  const [currentPage, setCurrentPage] = useState('players');
  const [isGlobalAuthenticated, setIsGlobalAuthenticated] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [globalPassword, setGlobalPassword] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(true);
  const [darkMode, setDarkMode] = useState(true); // Default to dark mode

  // Check for stored preferences on app load
  useEffect(() => {
    const storedGlobalPassword = localStorage.getItem('globalPassword');
    const storedAdminPassword = localStorage.getItem('adminPassword');
    const storedDarkMode = localStorage.getItem('darkMode');
    
    if (storedGlobalPassword) {
      setGlobalPassword(storedGlobalPassword);
      setIsGlobalAuthenticated(true);
      setShowLoginModal(false);
    } else {
      setShowLoginModal(true);
    }
    
    if (storedAdminPassword) {
      setAdminPassword(storedAdminPassword);
      setIsAdminAuthenticated(true);
    }

    // Set dark mode preference (default to true if not stored)
    if (storedDarkMode !== null) {
      setDarkMode(storedDarkMode === 'true');
    }
  }, []);

  const handleToggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
  };

  // Create theme based on dark mode preference
  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
    },
  });

  // Check for stored authentication on app load
  useEffect(() => {
    const storedGlobalPassword = localStorage.getItem('globalPassword');
    const storedAdminPassword = localStorage.getItem('adminPassword');
    
    if (storedGlobalPassword) {
      setGlobalPassword(storedGlobalPassword);
      setIsGlobalAuthenticated(true);
      setShowLoginModal(false);
    } else {
      setShowLoginModal(true);
    }
    
    if (storedAdminPassword) {
      setAdminPassword(storedAdminPassword);
      setIsAdminAuthenticated(true);
    }
  }, []);

  const handleGlobalAuth = (password) => {
    setGlobalPassword(password);
    setIsGlobalAuthenticated(true);
    localStorage.setItem('globalPassword', password);
    setShowLoginModal(false);
  };

  const handleAdminAuth = (password) => {
    setAdminPassword(password);
    setIsAdminAuthenticated(true);
    localStorage.setItem('adminPassword', password);
    setShowLoginModal(false);
    setShowAdminSection(false);
  };

  const handleLogout = () => {
    setIsGlobalAuthenticated(false);
    setIsAdminAuthenticated(false);
    setGlobalPassword('');
    setAdminPassword('');
    localStorage.removeItem('globalPassword');
    localStorage.removeItem('adminPassword');
    setShowLoginModal(true);
  };

  const handleLogoutAdmin = () => {
    setIsAdminAuthenticated(false);
    setAdminPassword('');
    localStorage.removeItem('adminPassword');
  };

  const [showAdminSection, setShowAdminSection] = useState(false);

  const handleEnableAdmin = () => {
    setShowAdminSection(true);
    setShowLoginModal(true);
  };

  // Redirect away from backups page if admin mode is disabled
  useEffect(() => {
    if (currentPage === 'backups' && !isAdminAuthenticated) {
      setCurrentPage('players');
    }
  }, [currentPage, isAdminAuthenticated]);

  // Don't render the app content if not globally authenticated
  if (!isGlobalAuthenticated) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LoginModal
          open={showLoginModal}
          onClose={() => {}} // Prevent closing without authentication
          onGlobalAuth={handleGlobalAuth}
          onAdminAuth={handleAdminAuth}
          isGlobalAuthenticated={isGlobalAuthenticated}
          isAdminAuthenticated={isAdminAuthenticated}
          showAdminSection={showAdminSection}
        />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ 
        mt: 2, 
        mb: 2, 
        px: { xs: 1, sm: 2, md: 3, lg: 4 }, 
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box'
      }}>
        <NavBar 
          currentPage={currentPage} 
          onPageChange={setCurrentPage}
          isAdminAuthenticated={isAdminAuthenticated}
          onLogout={handleLogout}
          onLogoutAdmin={handleLogoutAdmin}
          onEnableAdmin={handleEnableAdmin}
          darkMode={darkMode}
          onToggleDarkMode={handleToggleDarkMode}
        />
        
        {currentPage === 'players' && (
          <PlayersPage 
            globalPassword={globalPassword}
            adminPassword={adminPassword}
            isAdminAuthenticated={isAdminAuthenticated}
          />
        )}
        
        {currentPage === 'matches' && (
          <MatchesPage 
            globalPassword={globalPassword}
            adminPassword={adminPassword}
            isAdminAuthenticated={isAdminAuthenticated}
          />
        )}
        
        {currentPage === 'backups' && (
          <BackupManager 
            globalPassword={globalPassword}
            adminPassword={adminPassword}
            isAdminAuthenticated={isAdminAuthenticated}
          />
        )}
      </Box>
      
      <LoginModal
        open={showLoginModal}
        onClose={() => {
          setShowLoginModal(false);
          setShowAdminSection(false);
        }}
        onGlobalAuth={handleGlobalAuth}
        onAdminAuth={handleAdminAuth}
        isGlobalAuthenticated={isGlobalAuthenticated}
        isAdminAuthenticated={isAdminAuthenticated}
        showAdminSection={showAdminSection}
      />
      

    </ThemeProvider>
  );
}

export default App;
