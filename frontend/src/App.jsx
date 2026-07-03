import React, { useState, useEffect } from 'react';
import { Box, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import NavBar from './components/NavBar';
import PlayersPage from './pages/PlayersPage';
import MatchesPage from './pages/MatchesPage';
import BackupManager from './components/BackupManager';
import LoginModal from './components/LoginModal';
import { getCurrentSeasonStartYear, ALL_SEASONS } from './utils/season';

function App() {
  const [currentPage, setCurrentPage] = useState('players');
  const [isGlobalAuthenticated, setIsGlobalAuthenticated] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [globalPassword, setGlobalPassword] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(true);
  const [darkMode, setDarkMode] = useState(true); // Default to dark mode
  // Season to filter stats by; shared across pages and persisted.
  const [selectedSeason, setSelectedSeason] = useState(getCurrentSeasonStartYear());

  // Check for stored preferences on app load
  useEffect(() => {
    const storedGlobalPassword = localStorage.getItem('globalPassword');
    const storedAdminPassword = localStorage.getItem('adminPassword');
    const storedDarkMode = localStorage.getItem('darkMode');
    const storedSeason = localStorage.getItem('selectedSeason');

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

    // Restore season filter (stored as "all" or a numeric start year).
    if (storedSeason !== null) {
      setSelectedSeason(storedSeason === ALL_SEASONS ? ALL_SEASONS : Number(storedSeason));
    }
  }, []);

  const handleSeasonChange = (season) => {
    setSelectedSeason(season);
    localStorage.setItem('selectedSeason', season.toString());
  };

  const handleToggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
  };

  // Create theme based on dark mode preference. Modern refresh: green accent,
  // rounded surfaces, softer background, cleaner typography.
  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: { main: darkMode ? '#66bb6a' : '#2e7d32' },
      secondary: { main: '#f9a825' },
      ...(darkMode
        ? { background: { default: '#121417', paper: '#1c1f24' } }
        : { background: { default: '#f4f6f8', paper: '#ffffff' } }),
    },
    shape: { borderRadius: 12 },
    typography: {
      fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      h5: { fontWeight: 700 },
      h6: { fontWeight: 700 },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    components: {
      MuiAppBar: { defaultProps: { elevation: 0 } },
      MuiButton: { defaultProps: { disableElevation: true } },
      MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
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

      <Box
        sx={{
          maxWidth: 1100,
          mx: 'auto',
          width: '100%',
          px: { xs: 2, sm: 3 },
          py: { xs: 2, sm: 3 },
          boxSizing: 'border-box',
        }}
      >
        {currentPage === 'players' && (
          <PlayersPage
            globalPassword={globalPassword}
            adminPassword={adminPassword}
            isAdminAuthenticated={isAdminAuthenticated}
            selectedSeason={selectedSeason}
            onSeasonChange={handleSeasonChange}
          />
        )}

        {currentPage === 'matches' && (
          <MatchesPage
            globalPassword={globalPassword}
            adminPassword={adminPassword}
            isAdminAuthenticated={isAdminAuthenticated}
            selectedSeason={selectedSeason}
            onSeasonChange={handleSeasonChange}
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
