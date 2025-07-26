import React, { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Box,
  Typography,
  MenuItem,
  IconButton,
  Alert,
  Grid,
  Paper
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { createMatch, getPlayers } from '../api';

const MatchForm = ({ globalPassword, isAdminAuthenticated }) => {
  const [date, setDate] = useState('');
  const [players, setPlayers] = useState([]);
  const [goalscorers, setGoalscorers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchPlayers();
  }, [globalPassword]);

  const fetchPlayers = async () => {
    try {
      const response = await getPlayers(globalPassword);
      if (response.ok) {
        const data = await response.json();
        setPlayers(data.sort((a, b) => a.name.localeCompare(b.name)));
      }
    } catch (error) {
      console.error('Failed to fetch players:', error);
    }
  };

  const addGoalscorer = () => {
    setGoalscorers([
      ...goalscorers,
      { player_id: '', team: 'young', goals: 0, own_goals: 0 }
    ]);
  };

  const removeGoalscorer = (index) => {
    setGoalscorers(goalscorers.filter((_, i) => i !== index));
  };

  const updateGoalscorer = (index, field, value) => {
    const updated = [...goalscorers];
    updated[index] = { ...updated[index], [field]: value };
    setGoalscorers(updated);
  };

  const calculateScores = () => {
    let teamYoungScore = 0;
    let teamOldScore = 0;

    goalscorers.forEach(scorer => {
      if (scorer.player_id && (scorer.goals > 0 || scorer.own_goals > 0)) {
        if (scorer.team === 'young') {
          teamYoungScore += scorer.goals;
          teamOldScore += scorer.own_goals; // Own goals count for the other team
        } else {
          teamOldScore += scorer.goals;
          teamYoungScore += scorer.own_goals; // Own goals count for the other team
        }
      }
    });

    return { teamYoungScore, teamOldScore };
  };

  const canSubmit = () => {
    if (!date) return false;
    return goalscorers.some(scorer => 
      scorer.player_id && (scorer.goals > 0 || scorer.own_goals > 0)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit()) {
      setError('Please fill in the date and add at least one goal');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const { teamYoungScore, teamOldScore } = calculateScores();

    // Convert goalscorers to the format expected by the API
    const goals = goalscorers
      .filter(scorer => scorer.player_id && (scorer.goals > 0 || scorer.own_goals > 0))
      .flatMap(scorer => {
        const goals = [];
        // Add regular goals
        for (let i = 0; i < scorer.goals; i++) {
          goals.push({
            player_id: parseInt(scorer.player_id),
            team: scorer.team,
            is_own_goal: false
          });
        }
        // Add own goals
        for (let i = 0; i < scorer.own_goals; i++) {
          goals.push({
            player_id: parseInt(scorer.player_id),
            team: scorer.team,
            is_own_goal: true
          });
        }
        return goals;
      });

    try {
      const response = await createMatch({
        date,
        team_young_score: teamYoungScore,
        team_old_score: teamOldScore,
        goals
      }, globalPassword);

      if (response.ok) {
        setSuccess('Match added successfully!');
        setDate('');
        setGoalscorers([]);
        // Trigger refresh of match list
        window.location.reload();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to add match');
      }
    } catch (error) {
      setError('Failed to add match. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const { teamYoungScore, teamOldScore } = calculateScores();

  if (!isAdminAuthenticated) {
    return null;
  }

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" gutterBottom>
        Add New Match
      </Typography>

      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              disabled={loading}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="body2" gutterBottom sx={{ fontWeight: 'bold' }}>
                Calculated Score:
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                <Typography component="span" sx={{ color: 'primary.main' }}>Team Old</Typography> {teamOldScore} : {teamYoungScore} <Typography component="span" sx={{ color: 'secondary.main' }}>Team Young</Typography>
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Typography variant="h6" gutterBottom>
          Goalscorers
        </Typography>

        {goalscorers.map((scorer, index) => (
                          <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  select
                  label="Player"
                  value={scorer.player_id}
                  onChange={(e) => updateGoalscorer(index, 'player_id', e.target.value)}
                  disabled={loading}
                >
                  {players.map((player) => (
                    <MenuItem key={player.id} value={player.id}>
                      {player.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={2}>
                <TextField
                  fullWidth
                  select
                  label="Team"
                  value={scorer.team}
                  onChange={(e) => updateGoalscorer(index, 'team', e.target.value)}
                  disabled={loading}
                >
                  <MenuItem value="old">Team Old</MenuItem>
                  <MenuItem value="young">Team Young</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={2}>
                <TextField
                  fullWidth
                  type="number"
                  label="Goals"
                  value={scorer.goals}
                  onChange={(e) => updateGoalscorer(index, 'goals', parseInt(e.target.value) || 0)}
                  disabled={loading}
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <TextField
                  fullWidth
                  type="number"
                  label="Own Goals"
                  value={scorer.own_goals}
                  onChange={(e) => updateGoalscorer(index, 'own_goals', parseInt(e.target.value) || 0)}
                  disabled={loading}
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <IconButton
                  onClick={() => removeGoalscorer(index)}
                  disabled={loading}
                  color="error"
                >
                  <RemoveIcon />
                </IconButton>
              </Grid>
            </Grid>
          </Box>
        ))}

        <Button
          type="button"
          onClick={addGoalscorer}
          disabled={loading}
          startIcon={<AddIcon />}
          sx={{ mb: 2 }}
        >
          Add Goalscorer
        </Button>

        <Box sx={{ mb: 2 }}>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !canSubmit()}
          >
            {loading ? 'Adding Match...' : 'Add Match'}
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
    </Paper>
  );
};

export default MatchForm; 