import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert
} from '@mui/material';
import { updatePlayer, deletePlayer } from '../api';

const PlayerModal = ({ open, onClose, player, adminPassword, isAdminAuthenticated, onPlayerUpdated }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(player?.name || '');
  const [birthdate, setBirthdate] = useState(player?.birthdate || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formatBirthdate = (birthdateString) => {
    if (!birthdateString) return '';
    const date = new Date(birthdateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleSave = async () => {
    if (!name.trim() || !birthdate) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await updatePlayer(player.id, { name: name.trim(), birthdate }, adminPassword);
      
      if (response.ok) {
        setIsEditing(false);
        onPlayerUpdated();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to update player');
      }
    } catch (error) {
      setError('Failed to update player');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    // Special handling for unknown player
    if (player.name === "Unknown Player (Deleted)") {
      setError('Cannot delete the Unknown Player. Use "Manage Unknown Goals" to reassign goals instead.');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${player.name}? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await deletePlayer(player.id, adminPassword);
      
      if (response.ok) {
        const result = await response.json();
        onClose();
        onPlayerUpdated();
        // Show success message if goals were reassigned
        if (result.reassigned_goals > 0) {
          alert(`Player deleted successfully. ${result.reassigned_goals} goals were reassigned to the Unknown Player.`);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to delete player');
      }
    } catch (error) {
      setError('Failed to delete player');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setName(player?.name || '');
    setBirthdate(player?.birthdate || '');
    setError('');
  };

  if (!player) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {isEditing ? 'Edit Player' : player.name}
      </DialogTitle>
      
      <DialogContent>
        {isEditing ? (
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              sx={{ mb: 2 }}
              disabled={loading}
            />
            <TextField
              fullWidth
              label="Birthdate"
              type="date"
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              disabled={loading}
            />
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </Box>
        ) : (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" gutterBottom>
              <strong>Name:</strong> {player.name}
              {player.name === "Unknown Player (Deleted)" && (
                <Typography 
                  component="span" 
                  sx={{ 
                    color: 'warning.main', 
                    ml: 1 
                  }}
                >
                  (Goals from deleted players)
                </Typography>
              )}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Birthdate:</strong> {
                player.name === "Unknown Player (Deleted)" 
                  ? "Unknown (placeholder date)" 
                  : formatBirthdate(player.birthdate)
              }
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Total Goals:</strong> {player.goals.filter(g => !g.is_own_goal).length}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Own Goals:</strong> {player.goals.filter(g => g.is_own_goal).length}
            </Typography>
          </Box>
        )}

        {player.goals.length > 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Goals by Match
            </Typography>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Team</TableCell>
                    <TableCell>End Score</TableCell>
                    <TableCell>Goals</TableCell>
                    <TableCell>Own Goals</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(() => {
                    // Group goals by match
                    const goalsByMatch = {};
                    player.goals.forEach(goal => {
                      const matchId = goal.match?.id;
                      if (!matchId) return;
                      
                      if (!goalsByMatch[matchId]) {
                        goalsByMatch[matchId] = {
                          matchId,
                          date: goal.match.date,
                          team: goal.team,
                          endScore: `${goal.match.team_old_score}:${goal.match.team_young_score}`,
                          goals: 0,
                          ownGoals: 0
                        };
                      }
                      
                      if (goal.is_own_goal) {
                        goalsByMatch[matchId].ownGoals++;
                      } else {
                        goalsByMatch[matchId].goals++;
                      }
                    });
                    
                    return Object.values(goalsByMatch).map((match) => (
                      <TableRow key={match.matchId}>
                        <TableCell>{match.date}</TableCell>
                        <TableCell>{match.team}</TableCell>
                        <TableCell>{match.endScore}</TableCell>
                        <TableCell>{match.goals}</TableCell>
                        <TableCell>{match.ownGoals}</TableCell>
                      </TableRow>
                    ));
                  })()}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        {isAdminAuthenticated && (
          <>
            {isEditing ? (
              <>
                <Button onClick={handleCancel} disabled={loading}>
                  Cancel
                </Button>
                <Button onClick={handleSave} variant="contained" disabled={loading}>
                  {loading ? 'Saving...' : 'Save'}
                </Button>
              </>
            ) : (
              <>
                <Button onClick={() => setIsEditing(true)}>
                  Edit
                </Button>
                <Button onClick={handleDelete} color="error" disabled={loading}>
                  {loading ? 'Deleting...' : 'Delete'}
                </Button>
              </>
            )}
          </>
        )}
        <Button onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PlayerModal; 