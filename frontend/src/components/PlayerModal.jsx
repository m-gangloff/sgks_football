import React, { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import { updatePlayer, deletePlayer } from "../api";

export default function PlayerModal({ open, onClose, player, onUpdated, onDeleted }) {
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState(player?.name || "");
  const [birthdate, setBirthdate] = useState(player?.birthdate || "");
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    setName(player?.name || "");
    setBirthdate(player?.birthdate || "");
    setEditMode(false);
  }, [player, open]);

  const handleSave = async () => {
    setLoading(true);
    await updatePlayer(player.id, { name, birthdate });
    setLoading(false);
    setEditMode(false);
    if (onUpdated) onUpdated();
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this player?")) {
      setLoading(true);
      await deletePlayer(player.id);
      setLoading(false);
      if (onDeleted) onDeleted();
      onClose();
    }
  };

  // Prepare goal/match details
  let matchDetails = [];
  if (player && Array.isArray(player.goals) && player.goals.length > 0) {
    // Group goals by match
    const matchMap = {};
    player.goals.forEach(goal => {
      if (!goal.match) return;
      const matchId = goal.match.id;
      if (!matchMap[matchId]) {
        matchMap[matchId] = {
          date: goal.match.date,
          team: goal.team,
          team_young_score: goal.match.team_young_score,
          team_old_score: goal.match.team_old_score,
          goals: 0,
          own_goals: 0,
        };
      }
      if (goal.is_own_goal) {
        matchMap[matchId].own_goals += 1;
      } else {
        matchMap[matchId].goals += 1;
      }
    });
    matchDetails = Object.values(matchMap);
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Player Details</DialogTitle>
      <DialogContent>
        {editMode ? (
          <>
            <TextField
              label="Name"
              value={name}
              onChange={e => setName(e.target.value)}
              fullWidth
              margin="normal"
              required
            />
            <TextField
              label="Birthdate"
              type="date"
              value={birthdate}
              onChange={e => setBirthdate(e.target.value)}
              fullWidth
              margin="normal"
              required
              InputLabelProps={{ shrink: true }}
            />
          </>
        ) : (
          <>
            <Typography variant="h6">{player?.name}</Typography>
            <Typography variant="body1">Birthdate: {player?.birthdate}</Typography>
            {matchDetails.length > 0 && (
              <>
                <Typography variant="subtitle1" sx={{ mt: 2 }}>Goals by Match</Typography>
                <TableContainer component={Paper} sx={{ mt: 1, mb: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Team</TableCell>
                        <TableCell>Endscore</TableCell>
                        <TableCell>Goals</TableCell>
                        <TableCell>Own Goals</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {matchDetails.map((m, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{m.date}</TableCell>
                          <TableCell>{m.team}</TableCell>
                          <TableCell>{m.team_young_score} : {m.team_old_score}</TableCell>
                          <TableCell>{m.goals}</TableCell>
                          <TableCell>{m.own_goals}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        {editMode ? (
          <>
            <Button onClick={() => setEditMode(false)} disabled={loading}>Cancel</Button>
            <Button onClick={handleSave} disabled={loading || !name || !birthdate} variant="contained">Save</Button>
          </>
        ) : (
          <>
            <Button onClick={() => setEditMode(true)}>Edit</Button>
            <Button onClick={handleDelete} color="error">Delete</Button>
            <Button onClick={onClose}>Close</Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
} 