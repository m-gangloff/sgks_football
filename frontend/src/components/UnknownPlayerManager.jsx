import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Box
} from '@mui/material';
import { getUnknownPlayerGoals, reassignGoals, getPlayers } from '../api';

const UnknownPlayerManager = ({ open, onClose, globalPassword, adminPassword, isAdminAuthenticated }) => {
  const [unknownGoals, setUnknownGoals] = useState([]);
  const [players, setPlayers] = useState([]);
  const [selectedGoals, setSelectedGoals] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (open) {
      loadUnknownGoals();
      loadPlayers();
    }
  }, [open, globalPassword]);

  const loadUnknownGoals = async () => {
    try {
      const response = await getUnknownPlayerGoals(globalPassword);
      if (response.ok) {
        const data = await response.json();
        setUnknownGoals(data);
      }
    } catch (error) {
      console.error('Error loading unknown goals:', error);
    }
  };

  const loadPlayers = async () => {
    try {
      const response = await getPlayers(globalPassword);
      if (response.ok) {
        const data = await response.json();
        // Filter out the unknown player
        const realPlayers = data.filter(player => player.name !== "Unknown Player (Deleted)");
        setPlayers(realPlayers);
      }
    } catch (error) {
      console.error('Error loading players:', error);
    }
  };

  const handleGoalSelection = (goalId) => {
    setSelectedGoals(prev => 
      prev.includes(goalId) 
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    );
  };

  const handleReassign = async () => {
    if (selectedGoals.length === 0 || !selectedPlayer) {
      setMessage('Please select goals and a player to reassign to.');
      return;
    }

    setLoading(true);
    try {
      const response = await reassignGoals(selectedGoals, selectedPlayer, adminPassword);
      if (response.ok) {
        const result = await response.json();
        setMessage(`Successfully reassigned ${result.reassigned_goals} goals.`);
        setSelectedGoals([]);
        setSelectedPlayer('');
        loadUnknownGoals(); // Refresh the list
      } else {
        const error = await response.json();
        setMessage(`Error: ${error.detail}`);
      }
    } catch (error) {
      setMessage('Error reassigning goals.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Manage Unknown Player Goals</DialogTitle>
      <DialogContent>
        {message && (
          <Alert severity={message.includes('Error') ? 'error' : 'success'} sx={{ mb: 2 }}>
            {message}
          </Alert>
        )}
        
        <Typography variant="body2" sx={{ mb: 2 }}>
          These goals belong to players who have been deleted. You can reassign them to existing players.
        </Typography>

        {unknownGoals.length === 0 ? (
          <Typography variant="body1" color="text.secondary">
            No goals assigned to unknown player.
          </Typography>
        ) : (
          <>
            <TableContainer component={Paper} sx={{ mb: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <input
                        type="checkbox"
                        checked={selectedGoals.length === unknownGoals.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedGoals(unknownGoals.map(g => g.id));
                          } else {
                            setSelectedGoals([]);
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>Match Date</TableCell>
                    <TableCell>Team</TableCell>
                    <TableCell>Own Goal</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {unknownGoals.map((goal) => (
                    <TableRow key={goal.id}>
                      <TableCell padding="checkbox">
                        <input
                          type="checkbox"
                          checked={selectedGoals.includes(goal.id)}
                          onChange={() => handleGoalSelection(goal.id)}
                        />
                      </TableCell>
                      <TableCell>{formatDate(goal.match?.date)}</TableCell>
                      <TableCell>{goal.team}</TableCell>
                      <TableCell>{goal.is_own_goal ? 'Yes' : 'No'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {isAdminAuthenticated && selectedGoals.length > 0 && (
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Typography>Reassign to:</Typography>
                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel>Select Player</InputLabel>
                  <Select
                    value={selectedPlayer}
                    onChange={(e) => setSelectedPlayer(e.target.value)}
                    label="Select Player"
                  >
                    {players.map((player) => (
                      <MenuItem key={player.id} value={player.id}>
                        {player.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  variant="contained"
                  onClick={handleReassign}
                  disabled={loading || !selectedPlayer}
                >
                  {loading ? 'Reassigning...' : 'Reassign Goals'}
                </Button>
              </Box>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default UnknownPlayerManager; 