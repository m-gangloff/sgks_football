import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  List,
  ListItem,
  ListItemText,
  Switch,
  Typography,
  Alert,
} from '@mui/material';
import { setPlayerVisibility, clearPlayerVisibility } from '../api';
import {
  getSeasonLabel,
  isPlayerHidden,
  getExplicitOverride,
} from '../utils/season';

// Admin-only dialog to control which players appear in the roster for the
// selected season. Toggling writes an explicit override for that season;
// "Reset" clears it so the season inherits the previous season's state.
const PlayerVisibilityManager = ({
  open,
  onClose,
  players,
  overrides,
  selectedSeason,
  adminPassword,
  onChanged,
}) => {
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const handleToggle = async (player, makeActive) => {
    setError('');
    setBusyId(player.id);
    try {
      const response = await setPlayerVisibility(
        player.id,
        selectedSeason,
        !makeActive, // hidden = not active
        adminPassword
      );
      if (response.ok) {
        onChanged();
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to update visibility');
      }
    } catch (e) {
      setError('Failed to update visibility');
    } finally {
      setBusyId(null);
    }
  };

  const handleReset = async (player) => {
    setError('');
    setBusyId(player.id);
    try {
      const response = await clearPlayerVisibility(
        player.id,
        selectedSeason,
        adminPassword
      );
      if (response.ok) {
        onChanged();
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to reset visibility');
      }
    } catch (e) {
      setError('Failed to reset visibility');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Active Players — {getSeasonLabel(selectedSeason)}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Toggle whether each player appears in the roster this season. Hidden
          players stay in the database (their goals are kept) and carry over to
          later seasons until changed. "Inherited" means the state comes from an
          earlier season.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <List>
          {players.map((player) => {
            const hidden = isPlayerHidden(overrides, player.id, selectedSeason);
            const explicit = getExplicitOverride(
              overrides,
              player.id,
              selectedSeason
            );
            return (
              <ListItem
                key={player.id}
                divider
                secondaryAction={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {explicit ? (
                      <Button
                        size="small"
                        onClick={() => handleReset(player)}
                        disabled={busyId === player.id}
                      >
                        Reset
                      </Button>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        inherited
                      </Typography>
                    )}
                    <Switch
                      edge="end"
                      checked={!hidden}
                      onChange={(e) => handleToggle(player, e.target.checked)}
                      disabled={busyId === player.id}
                    />
                  </Box>
                }
              >
                <ListItemText
                  primary={player.name}
                  secondary={hidden ? 'Hidden' : 'Active'}
                />
              </ListItem>
            );
          })}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default PlayerVisibilityManager;
