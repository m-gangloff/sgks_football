import React, { useState, useEffect } from 'react';
import {
  List,
  ListItem,
  ListItemText,
  Typography,
  Button,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import { getPlayers, deleteAllPlayers, addDefaultPlayers } from '../api';
import PlayerModal from './PlayerModal';
import UnknownPlayerManager from './UnknownPlayerManager';

const PlayerList = ({ globalPassword, adminPassword, isAdminAuthenticated }) => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showUnknownPlayerManager, setShowUnknownPlayerManager] = useState(false);

  const handleOpenUnknownPlayerManager = () => {
    setShowUnknownPlayerManager(true);
  };

  const fetchPlayers = async () => {
    try {
      const response = await getPlayers(globalPassword);
      if (response.ok) {
        const data = await response.json();
        // Sort players by non-own goals (descending)
        const sortedPlayers = data.sort((a, b) => {
          const aGoals = a.goals.filter(g => !g.is_own_goal).length;
          const bGoals = b.goals.filter(g => !g.is_own_goal).length;
          return bGoals - aGoals;
        });
        setPlayers(sortedPlayers);
      } else {
        setError('Failed to load players');
      }
    } catch (error) {
      setError('Failed to load players');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, [globalPassword]);

  const handlePlayerClick = (player) => {
    setSelectedPlayer(player);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedPlayer(null);
  };

  const handlePlayerUpdated = () => {
    fetchPlayers();
    handleCloseModal();
  };

  const handleDeleteAllPlayers = async () => {
    if (!window.confirm('Are you sure you want to delete ALL players? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await deleteAllPlayers(adminPassword);
      if (response.ok) {
        setPlayers([]);
        alert('All players deleted successfully!');
      } else {
        const errorData = await response.json();
        alert(errorData.detail || 'Failed to delete all players');
      }
    } catch (error) {
      alert('Failed to delete all players');
    }
  };

  const handleAddDefaultPlayers = async () => {
    if (!window.confirm('Add the default set of players? This will add 18 predefined players to the database, skipping any that already exist.')) {
      return;
    }

    try {
      const response = await addDefaultPlayers(adminPassword);
      if (response.ok) {
        const result = await response.json();
        let message = `Successfully added ${result.added} new players!`;
        if (result.skipped > 0) {
          message += `\nSkipped ${result.skipped} players that already exist.`;
        }
        if (result.added === 0) {
          message = `All ${result.total_requested} default players already exist in the database.`;
        }
        alert(message);
        fetchPlayers(); // Refresh the player list
      } else {
        const errorData = await response.json();
        alert(errorData.detail || 'Failed to add default players');
      }
    } catch (error) {
      alert('Failed to add default players');
    }
  };

  const formatBirthdate = (birthdateString) => {
    if (!birthdateString) return '';
    const date = new Date(birthdateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Players ({players.length})
      </Typography>

      {isAdminAuthenticated && (
        <Box sx={{ 
          mb: 2,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 1, sm: 2 },
          flexWrap: 'wrap'
        }}>
          <Button
            variant="outlined"
            color="primary"
            onClick={handleAddDefaultPlayers}
            sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
          >
            Add Default Players
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={handleDeleteAllPlayers}
            sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
          >
            Delete All Players
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleOpenUnknownPlayerManager}
            sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
          >
            Manage Unknown Goals
          </Button>
        </Box>
      )}

      {players.length === 0 ? (
        <Typography variant="body1" color="text.secondary">
          No players found. {isAdminAuthenticated ? 'Add some players to get started!' : 'Contact an admin to add players.'}
        </Typography>
      ) : (
        <List>
          {players.map((player) => {
            const nonOwnGoals = player.goals.filter(g => !g.is_own_goal).length;
            const ownGoals = player.goals.filter(g => g.is_own_goal).length;
            
            return (
              <ListItem
                key={player.id}
                button
                onClick={() => handlePlayerClick(player)}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  mb: 1,
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <ListItemText
                  primary={
                    <Box 
                      display="flex" 
                      justifyContent="space-between" 
                      alignItems="center"
                      flexDirection={{ xs: 'column', sm: 'row' }}
                      gap={{ xs: 0.5, sm: 0 }}
                    >
                      <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                        <Typography variant="h6" component="span">
                          {player.name}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          component="span" 
                          sx={{ ml: 1 }}
                        >
                          {formatBirthdate(player.birthdate)}
                        </Typography>
                        {player.name === "Unknown Player (Deleted)" && (
                          <Typography 
                            component="span" 
                            sx={{ 
                              color: 'warning.main', 
                              ml: 1, 
                              fontSize: '0.8em' 
                            }}
                          >
                            (Goals from deleted players)
                          </Typography>
                        )}
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: { xs: 'center', sm: 'right' } }}>
                        {nonOwnGoals} goals, {ownGoals} own goals
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            );
          })}
        </List>
      )}

      {selectedPlayer && (
        <PlayerModal
          open={showModal}
          onClose={handleCloseModal}
          player={selectedPlayer}
          adminPassword={adminPassword}
          isAdminAuthenticated={isAdminAuthenticated}
          onPlayerUpdated={handlePlayerUpdated}
        />
      )}

      <UnknownPlayerManager
        open={showUnknownPlayerManager}
        onClose={() => setShowUnknownPlayerManager(false)}
        globalPassword={globalPassword}
        adminPassword={adminPassword}
        isAdminAuthenticated={isAdminAuthenticated}
        onGoalsReassigned={fetchPlayers}
      />
    </Box>
  );
};

export default PlayerList; 