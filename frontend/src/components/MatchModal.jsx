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
import { updateMatch, deleteMatch } from '../api';

const MatchModal = ({ open, onClose, match, adminPassword, isAdminAuthenticated, onMatchUpdated }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [date, setDate] = useState(match?.date || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!date) {
      setError('Please fill in the date');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Send complete match data including existing goals
      const matchData = {
        date: date,
        team_young_score: match.team_young_score,
        team_old_score: match.team_old_score,
        goals: match.goals.map(goal => ({
          player_id: goal.player_id,
          is_own_goal: goal.is_own_goal,
          team: goal.team
        }))
      };
      
      const response = await updateMatch(match.id, matchData, adminPassword);
      
      if (response.ok) {
        setIsEditing(false);
        onMatchUpdated();
      } else {
        const errorData = await response.json();
        // Handle validation errors properly
        if (errorData.detail && Array.isArray(errorData.detail)) {
          const errorMessages = errorData.detail.map(err => `${err.loc.join('.')}: ${err.msg}`).join(', ');
          setError(errorMessages);
        } else {
          setError(errorData.detail || 'Failed to update match');
        }
      }
    } catch (error) {
      setError('Failed to update match');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setDate(match?.date || '');
    setError('');
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete this match?\n\n${match.date} - ${match.team_old_score}:${match.team_young_score}\n\nThis will also delete all goals from this match.`)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await deleteMatch(match.id, adminPassword);
      
      if (response.ok) {
        const result = await response.json();
        alert(`Match deleted successfully!\n\nDeleted: ${result.deleted_match}\nGoals removed: ${result.deleted_goals}`);
        onMatchUpdated();
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to delete match');
      }
    } catch (error) {
      setError('Failed to delete match: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!match) return null;

  // Group goals by team and player
  const youngGoals = match.goals.filter(g => g.team === 'young');
  const oldGoals = match.goals.filter(g => g.team === 'old');
  
  // Group goals by player for each team
  const groupGoalsByPlayer = (goals) => {
    const grouped = {};
    goals.forEach(goal => {
      const playerId = goal.player_id;
      const playerName = goal.player?.name || 'Unknown Player';
      
      if (!grouped[playerId]) {
        grouped[playerId] = {
          playerId,
          playerName,
          goals: 0,
          ownGoals: 0
        };
      }
      
      if (goal.is_own_goal) {
        grouped[playerId].ownGoals++;
      } else {
        grouped[playerId].goals++;
      }
    });
    
    return Object.values(grouped);
  };
  
  const youngGoalsGrouped = groupGoalsByPlayer(youngGoals);
  const oldGoalsGrouped = groupGoalsByPlayer(oldGoals);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {isEditing ? 'Edit Match' : `Match on ${match.date}`}
      </DialogTitle>
      
      <DialogContent>
        {isEditing ? (
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
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
            <Typography variant="h6" gutterBottom>
              Final Score: Team Old {match.team_old_score} : {match.team_young_score} Team Young
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Date:</strong> {match.date}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Total Goals:</strong> {match.team_old_score + match.team_young_score}
            </Typography>
          </Box>
        )}

        {match.goals.length > 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Goals Breakdown
            </Typography>
            
            {youngGoalsGrouped.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Goals for Team Young
                </Typography>
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Player</TableCell>
                        <TableCell>Goals</TableCell>
                        <TableCell>Own Goals</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {youngGoalsGrouped.map((player) => (
                        <TableRow key={player.playerId}>
                          <TableCell>{player.playerName}</TableCell>
                          <TableCell>{player.goals}</TableCell>
                          <TableCell>{player.ownGoals}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {oldGoalsGrouped.length > 0 && (
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Goals for Team Old
                </Typography>
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Player</TableCell>
                        <TableCell>Goals</TableCell>
                        <TableCell>Own Goals</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {oldGoalsGrouped.map((player) => (
                        <TableRow key={player.playerId}>
                          <TableCell>{player.playerName}</TableCell>
                          <TableCell>{player.goals}</TableCell>
                          <TableCell>{player.ownGoals}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
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

export default MatchModal; 