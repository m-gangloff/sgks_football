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
import { getPlayers, getPlayerVisibility, deleteAllPlayers, addDefaultPlayers } from '../api';
import PlayerModal from './PlayerModal';
import UnknownPlayerManager from './UnknownPlayerManager';
import SeasonSelector from './SeasonSelector';
import PlayerVisibilityManager from './PlayerVisibilityManager';
import { seasonsFromDates, isDateInSeason, isPlayerHidden, ALL_SEASONS } from '../utils/season';

const PlayerList = ({ globalPassword, adminPassword, isAdminAuthenticated, selectedSeason, onSeasonChange }) => {
  const [players, setPlayers] = useState([]);
  const [visibility, setVisibility] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showUnknownPlayerManager, setShowUnknownPlayerManager] = useState(false);
  const [showVisibilityManager, setShowVisibilityManager] = useState(false);

  const handleOpenUnknownPlayerManager = () => {
    setShowUnknownPlayerManager(true);
  };

  const fetchPlayers = async () => {
    try {
      const response = await getPlayers(globalPassword);
      if (response.ok) {
        const data = await response.json();
        // Store raw players; season filtering and sorting happen at render time.
        setPlayers(data);
      } else {
        setError('Failed to load players');
      }
    } catch (error) {
      setError('Failed to load players');
    } finally {
      setLoading(false);
    }
  };

  const fetchVisibility = async () => {
    try {
      const response = await getPlayerVisibility(globalPassword);
      if (response.ok) {
        setVisibility(await response.json());
      }
    } catch (error) {
      // Non-fatal: without overrides everyone is treated as visible.
    }
  };

  useEffect(() => {
    fetchPlayers();
    fetchVisibility();
  }, [globalPassword]);

  // Seasons available across all goals (derived from each goal's match date).
  const availableSeasons = seasonsFromDates(
    players.flatMap((p) => p.goals.map((g) => g.match?.date))
  );

  // Each player with their goals restricted to the selected season, sorted by
  // non-own goals scored that season (descending). The selection is shared, so
  // the per-player modal receives the same season-filtered goals.
  const seasonPlayers = players
    .map((player) => ({
      ...player,
      goals: player.goals.filter((g) => isDateInSeason(g.match?.date, selectedSeason)),
    }))
    .sort((a, b) => {
      const aGoals = a.goals.filter((g) => !g.is_own_goal).length;
      const bGoals = b.goals.filter((g) => !g.is_own_goal).length;
      return bGoals - aGoals;
    });

  // Roster shown in the UI hides players marked hidden for the selected season.
  const visiblePlayers = seasonPlayers.filter(
    (p) => !isPlayerHidden(visibility, p.id, selectedSeason)
  );
  const hiddenCount = seasonPlayers.length - visiblePlayers.length;
  const canManageVisibility = isAdminAuthenticated && selectedSeason !== ALL_SEASONS;

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
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
          gap: 1,
          mb: 1,
        }}
      >
        <Typography variant="h5" gutterBottom sx={{ mb: 0 }}>
          Players ({visiblePlayers.length})
          {isAdminAuthenticated && hiddenCount > 0 && (
            <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              ({hiddenCount} hidden)
            </Typography>
          )}
        </Typography>
        <SeasonSelector
          value={selectedSeason}
          onChange={onSeasonChange}
          seasons={availableSeasons}
        />
      </Box>

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
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => setShowVisibilityManager(true)}
            disabled={!canManageVisibility}
            title={canManageVisibility ? undefined : 'Select a specific season to manage active players'}
            sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
          >
            Manage Active Players
          </Button>
        </Box>
      )}

      {visiblePlayers.length === 0 ? (
        <Typography variant="body1" color="text.secondary">
          {players.length === 0
            ? `No players found. ${isAdminAuthenticated ? 'Add some players to get started!' : 'Contact an admin to add players.'}`
            : 'No active players for this season.'}
        </Typography>
      ) : (
        <List>
          {visiblePlayers.map((player) => {
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

      {canManageVisibility && (
        <PlayerVisibilityManager
          open={showVisibilityManager}
          onClose={() => setShowVisibilityManager(false)}
          players={players}
          overrides={visibility}
          selectedSeason={selectedSeason}
          adminPassword={adminPassword}
          onChanged={fetchVisibility}
        />
      )}
    </Box>
  );
};

export default PlayerList; 