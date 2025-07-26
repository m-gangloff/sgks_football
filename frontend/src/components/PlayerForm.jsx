import React, { useState, useEffect } from 'react';
import { TextField, Button, Box, Typography, Alert } from '@mui/material';
import { createPlayer, getPlayers } from '../api';

const PlayerForm = ({ globalPassword, isAdminAuthenticated }) => {
  const [name, setName] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [existingPlayers, setExistingPlayers] = useState([]);
  const [nameError, setNameError] = useState('');

  // Fetch existing players for name validation
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const response = await getPlayers(globalPassword);
        if (response.ok) {
          const players = await response.json();
          setExistingPlayers(players);
        }
      } catch (error) {
        console.error('Failed to fetch players for validation:', error);
      }
    };

    if (isAdminAuthenticated && globalPassword) {
      fetchPlayers();
    }
  }, [globalPassword, isAdminAuthenticated]);

  // Validate name for duplicates
  const validateName = (playerName) => {
    if (!playerName.trim()) {
      setNameError('');
      return;
    }
    
    const isDuplicate = existingPlayers.some(player => 
      player.name.toLowerCase() === playerName.toLowerCase()
    );
    
    if (isDuplicate) {
      setNameError('A player with this name already exists');
    } else {
      setNameError('');
    }
  };

  const handleNameChange = (e) => {
    const newName = e.target.value;
    setName(newName);
    validateName(newName);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !birthdate) {
      setError('Please fill in all fields');
      return;
    }
    
    if (nameError) {
      setError('Please fix the name error before submitting');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await createPlayer(
        { name: name.trim(), birthdate },
        globalPassword
      );

      if (response.ok) {
        setSuccess('Player added successfully!');
        setName('');
        setBirthdate('');
        setNameError('');
        // Refresh the existing players list for validation
        const playersResponse = await getPlayers(globalPassword);
        if (playersResponse.ok) {
          const players = await playersResponse.json();
          setExistingPlayers(players);
        }
        // Auto-hide success message after 3 seconds
        setTimeout(() => {
          setSuccess('');
        }, 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to add player');
      }
    } catch (error) {
      setError('Failed to add player. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isAdminAuthenticated) {
    return null;
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mb: 3 }}>
      <Typography variant="h5" gutterBottom>
        Add New Player
      </Typography>
      
      <Box sx={{ 
        display: 'flex', 
        gap: { xs: 1, sm: 2 }, 
        mb: 2, 
        alignItems: 'flex-start',
        flexDirection: { xs: 'column', sm: 'row' }
      }}>
        <TextField
          label="Name"
          value={name}
          onChange={handleNameChange}
          required
          disabled={loading}
          error={!!nameError}
          helperText={nameError}
          sx={{ flexGrow: 1, minWidth: { xs: '100%', sm: 'auto' } }}
        />
        <TextField
          label="Birthdate"
          type="date"
          value={birthdate}
          onChange={(e) => setBirthdate(e.target.value)}
          required
          disabled={loading}
          InputLabelProps={{ shrink: true }}
          helperText=" " // Invisible helper text to maintain consistent height
          sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
        />
        <Button
          type="submit"
          variant="contained"
          disabled={loading}
          sx={{ 
            height: '56px',
            alignSelf: { xs: 'stretch', sm: 'flex-start' },
            minWidth: { xs: '100%', sm: 'auto' }
          }}
        >
          {loading ? 'Adding...' : 'Add Player'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}
    </Box>
  );
};

export default PlayerForm; 