import React, { useState, useEffect } from 'react';
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
  Alert,
  MenuItem,
  Grid,
  IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { updateMatch, deleteMatch, getPlayers, getPlayerVisibility } from '../api';
import { isPlayerHidden, getSeasonStartYear } from '../utils/season';
import { suggestTeamForPlayer } from '../utils/team';

// Scores are derived from the goalscorers: a goal counts for the scorer's team,
// an own goal counts for the opposing team. Mirrors MatchForm.
const calculateScores = (goalscorers) => {
  let teamYoungScore = 0;
  let teamOldScore = 0;
  goalscorers.forEach((scorer) => {
    if (scorer.player_id && scorer.team && (scorer.goals > 0 || scorer.own_goals > 0)) {
      if (scorer.team === 'young') {
        teamYoungScore += scorer.goals;
        teamOldScore += scorer.own_goals;
      } else {
        teamOldScore += scorer.goals;
        teamYoungScore += scorer.own_goals;
      }
    }
  });
  return { teamYoungScore, teamOldScore };
};

// Collapse the match's individual goal rows into per-player-per-team editors.
const buildGoalscorers = (goals) => {
  const grouped = {};
  goals.forEach((g) => {
    const key = `${g.player_id}-${g.team}`;
    if (!grouped[key]) {
      grouped[key] = { player_id: g.player_id, team: g.team, goals: 0, own_goals: 0 };
    }
    if (g.is_own_goal) grouped[key].own_goals += 1;
    else grouped[key].goals += 1;
  });
  return Object.values(grouped);
};

const MatchModal = ({ open, onClose, match, globalPassword, adminPassword, isAdminAuthenticated, onMatchUpdated }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [date, setDate] = useState(match?.date || '');
  const [goalscorers, setGoalscorers] = useState([]);
  const [players, setPlayers] = useState([]);
  const [visibility, setVisibility] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load the player list and visibility overrides (for the goalscorer
  // dropdowns) when an admin opens the modal.
  useEffect(() => {
    if (!open || !isAdminAuthenticated) return;
    let active = true;
    (async () => {
      try {
        const [playersRes, visRes] = await Promise.all([
          getPlayers(globalPassword),
          getPlayerVisibility(globalPassword),
        ]);
        if (playersRes.ok && active) {
          const data = await playersRes.json();
          setPlayers(data.sort((a, b) => a.name.localeCompare(b.name)));
        }
        if (visRes.ok && active) {
          setVisibility(await visRes.json());
        }
      } catch (e) {
        // Non-fatal: the dropdown will just be empty / treat all as active.
      }
    })();
    return () => {
      active = false;
    };
  }, [open, isAdminAuthenticated, globalPassword]);

  const handleStartEdit = () => {
    setDate(match.date);
    setGoalscorers(buildGoalscorers(match.goals));
    setError('');
    setIsEditing(true);
  };

  const addGoalscorer = () => {
    setGoalscorers([...goalscorers, { player_id: '', team: '', goals: 0, own_goals: 0 }]);
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
    const seasonYear = match ? getSeasonStartYear(match.date) : null;
    const activePlayers = players.filter((p) => !isPlayerHidden(visibility, p.id, seasonYear));
    const suggested = suggestTeamForPlayer(player, activePlayers);
    const updated = [...goalscorers];
    updated[index] = {
      ...updated[index],
      player_id: playerId,
      team: suggested || updated[index].team,
    };
    setGoalscorers(updated);
  };

  const { teamYoungScore, teamOldScore } = calculateScores(goalscorers);

  // Only players active in the match's season are selectable; scorers already
  // recorded on the match stay in the list even if now hidden.
  const season = match ? getSeasonStartYear(match.date) : null;
  const activeIds = new Set(
    players.filter((p) => !isPlayerHidden(visibility, p.id, season)).map((p) => p.id)
  );
  const selectedIds = new Set(
    goalscorers.map((s) => Number(s.player_id)).filter(Boolean)
  );
  const optionPlayers = players.filter(
    (p) => activeIds.has(p.id) || selectedIds.has(p.id)
  );

  const handleSave = async () => {
    if (!date) {
      setError('Please fill in the date');
      return;
    }

    const missingTeam = goalscorers.some(
      (s) => s.player_id && (s.goals > 0 || s.own_goals > 0) && !s.team
    );
    if (missingTeam) {
      setError('Please select a team for each goalscorer');
      return;
    }

    setLoading(true);
    setError('');

    // Expand the per-player editors back into individual goal rows.
    const goals = goalscorers
      .filter((scorer) => scorer.player_id && scorer.team && (scorer.goals > 0 || scorer.own_goals > 0))
      .flatMap((scorer) => {
        const rows = [];
        for (let i = 0; i < scorer.goals; i++) {
          rows.push({ player_id: parseInt(scorer.player_id), team: scorer.team, is_own_goal: false });
        }
        for (let i = 0; i < scorer.own_goals; i++) {
          rows.push({ player_id: parseInt(scorer.player_id), team: scorer.team, is_own_goal: true });
        }
        return rows;
      });

    try {
      const matchData = {
        date,
        team_young_score: teamYoungScore,
        team_old_score: teamOldScore,
        goals,
      };

      const response = await updateMatch(match.id, matchData, adminPassword);

      if (response.ok) {
        setIsEditing(false);
        onMatchUpdated();
      } else {
        const errorData = await response.json();
        if (errorData.detail && Array.isArray(errorData.detail)) {
          setError(errorData.detail.map((err) => `${err.loc.join('.')}: ${err.msg}`).join(', '));
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
    setGoalscorers([]);
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

  // Group goals by team and player (read-only breakdown)
  const youngGoals = match.goals.filter(g => g.team === 'young');
  const oldGoals = match.goals.filter(g => g.team === 'old');

  const groupGoalsByPlayer = (goals) => {
    const grouped = {};
    goals.forEach(goal => {
      const playerId = goal.player_id;
      const playerName = goal.player?.name || 'Unknown Player';

      if (!grouped[playerId]) {
        grouped[playerId] = { playerId, playerName, goals: 0, ownGoals: 0 };
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
          <Box sx={{ mb: 1 }}>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  disabled={loading}
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
              sx={{ mb: 1 }}
            >
              Add Goalscorer
            </Button>

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

        {!isEditing && match.goals.length > 0 && (
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
                <Button onClick={handleStartEdit}>
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
