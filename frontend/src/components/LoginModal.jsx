import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  InputAdornment,
  IconButton
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

const API_URL = 'http://localhost:8000';

const LoginModal = ({ open, onClose, onGlobalAuth, onAdminAuth, isGlobalAuthenticated, isAdminAuthenticated, showAdminSection = false }) => {
  const [globalPassword, setGlobalPassword] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showGlobalPassword, setShowGlobalPassword] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleToggleGlobalPasswordVisibility = () => {
    setShowGlobalPassword(!showGlobalPassword);
  };

  const handleToggleAdminPasswordVisibility = () => {
    setShowAdminPassword(!showAdminPassword);
  };

  const handleGlobalLogin = async () => {
    if (!globalPassword.trim()) {
      setError('Please enter the global password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/auth/global`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: globalPassword }),
      });

      if (response.ok) {
        onGlobalAuth(globalPassword);
        setGlobalPassword('');
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Incorrect global password');
      }
    } catch (error) {
      setError('Failed to authenticate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async () => {
    if (!adminPassword.trim()) {
      setError('Please enter the admin password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/auth/admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: adminPassword }),
      });

      if (response.ok) {
        onAdminAuth(adminPassword);
        setAdminPassword('');
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Incorrect admin password');
      }
    } catch (error) {
      setError('Failed to authenticate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event, isAdmin = false) => {
    if (event.key === 'Enter') {
      if (isAdmin) {
        handleAdminLogin();
      } else {
        handleGlobalLogin();
      }
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Authentication Required</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Global Access
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter the shared password to access the football statistics.
          </Typography>
          <TextField
            fullWidth
            type={showGlobalPassword ? 'text' : 'password'}
            label="Global Password"
            value={globalPassword}
            onChange={(e) => setGlobalPassword(e.target.value)}
            onKeyPress={(e) => handleKeyPress(e, false)}
            disabled={isGlobalAuthenticated || loading}
            sx={{ mb: 1 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleToggleGlobalPasswordVisibility}
                    onMouseDown={(e) => e.preventDefault()}
                    edge="end"
                    disabled={isGlobalAuthenticated || loading}
                  >
                    {showGlobalPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          {isGlobalAuthenticated && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Global access granted
            </Alert>
          )}
          {!isGlobalAuthenticated && (
            <Button
              variant="contained"
              onClick={handleGlobalLogin}
              disabled={loading}
              fullWidth
            >
              {loading ? 'Authenticating...' : 'Login'}
            </Button>
          )}
        </Box>

        {(isGlobalAuthenticated || showAdminSection) && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Admin Access
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Enter the admin password to enable editing features.
            </Typography>
            <TextField
              fullWidth
              type={showAdminPassword ? 'text' : 'password'}
              label="Admin Password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, true)}
              disabled={isAdminAuthenticated || loading}
              sx={{ mb: 1 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleToggleAdminPasswordVisibility}
                      onMouseDown={(e) => e.preventDefault()}
                      edge="end"
                      disabled={isAdminAuthenticated || loading}
                    >
                      {showAdminPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            {isAdminAuthenticated && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Admin access granted
              </Alert>
            )}
            {!isAdminAuthenticated && (
              <Button
                variant="contained"
                color="secondary"
                onClick={handleAdminLogin}
                disabled={loading}
                fullWidth
              >
                {loading ? 'Authenticating...' : 'Enable Admin Mode'}
              </Button>
            )}
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LoginModal; 