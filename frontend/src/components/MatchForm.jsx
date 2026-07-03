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
import { createMatch, getPlayers, getPlayerVisibility } from '../api';
import { isPlayerHidden, getSeasonStartYear, getCurrentSeasonStartYear } from '../utils/season';
import { suggestTeamForPlayer } from '../utils/team';

const MatchForm = ({ globalPassword, isAdminAuthenticated }) => {
  const [date, setDate] = useState('');
  const [players, setPlayers] = useState([]);
  const [visibility, setVisibility] = useState([]);
  const [goalscorers, setGoalscorers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchPlayers();
    fetchVisibility();
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

  const fetchVisibility = async () => {
    try {
      const response = await getPlayerVisibility(globalPassword);
      if (response.ok) {
        setVisibility(await response.json());
      }
    } catch (error) {
      // Non-fatal: without overrides everyone is treated as active.
    }
  };

  const addGoalscorer = () => {
    setGoalscorers([
      ...goalscorers,
      { player_id: '', team: '', goals: 0, own_goals: 0 }
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

  // Selecting a player auto-suggests their team (previous team, else age-based).
  const handlePlayerSelect = (index, playerId) => {
    const player = players.find((p) => p.id === Number(playerId));
    const season = date ? getSeasonStartYear(date) : getCurrentSeasonStartYear();
    const activePlayers = players.filter((p) => !isPlayerHidden(visibility, p.id, season));
    const suggested = suggestTeamForPlayer(player, activePlayers);
    const updated = [...goalscorers];
    updated[index] = {
      ...updated[index],
      player_id: playerId,
      team: suggested || updated[index].team,
    };
    setGoalscorers(updated);
  };

  const calculateScores = () => {
    let teamYoungScore = 0;
    let teamOldScore = 0;

    goalscorers.forEach(scorer => {
      if (scorer.player_id && scorer.team && (scorer.goals > 0 || scorer.own_goals > 0)) {
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
    return Boolean(date);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit()) {
      setError('Please fill in the date');
      return;
    }

    // Every scorer with goals must have a team assigned.
    const missingTeam = goalscorers.some(
      (s) => s.player_id && (s.goals > 0 || s.own_goals > 0) && !s.team
    );
    if (missingTeam) {
      setError('Please select a team for each goalscorer');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const { teamYoungScore, teamOldScore } = calculateScores();

    // Convert goalscorers to the format expected by the API
    const goals = goalscorers
      .filter(scorer => scorer.player_id && scorer.team && (scorer.goals > 0 || scorer.own_goals > 0))
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

  // Only active players for the match's season are selectable. The season comes
  // from the entered date (falling back to the current season while empty).
  // Already-selected players are always kept in the list so a selection can't
  // silently disappear if the date changes into a season where they're hidden.
  const season = date ? getSeasonStartYear(date) : getCurrentSeasonStartYear();
  const activeIds = new Set(
    players.filter((p) => !isPlayerHidden(visibility, p.id, season)).map((p) => p.id)
  );
  const selectedIds = new Set(
    goalscorers.map((s) => Number(s.player_id)).filter(Boolean)
  );
  const optionPlayers = players.filter(
    (p) => activeIds.has(p.id) || selectedIds.has(p.id)
  );

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
                  onChange={(e) => handlePlayerSelect(index, e.target.value)}
                  disabled={loading}
                >
                  {optionPlayers.map((player) => (
                    <MenuItem key={player.id} value={player.id}>
                      {player.name}{!activeIds.has(player.id) ? ' (hidden)' : ''}
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
                  <MenuItem value=""><em>Select team</em></MenuItem>
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