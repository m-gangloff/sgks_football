import React, { useState, useEffect } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import IconButton from "@mui/material/IconButton";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { getPlayers } from "../api";

function GoalInput({ players, value, onChange, team }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
      <TextField
        select
        label="Player"
        value={value.player_id}
        onChange={e => onChange({ ...value, player_id: e.target.value })}
        style={{ minWidth: 160 }}
        size="small"
        required
      >
        {players.map(p => (
          <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
        ))}
      </TextField>
      <TextField
        label="Goals"
        type="number"
        value={value.goals}
        onChange={e => onChange({ ...value, goals: Math.max(0, Number(e.target.value)) })}
        size="small"
        inputProps={{ min: 0 }}
        style={{ width: 80 }}
        required
      />
      <TextField
        label="Own Goals"
        type="number"
        value={value.own_goals}
        onChange={e => onChange({ ...value, own_goals: Math.max(0, Number(e.target.value)) })}
        size="small"
        inputProps={{ min: 0 }}
        style={{ width: 100 }}
      />
    </div>
  );
}

export default function MatchForm({ open, onClose, onMatchAdded }) {
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [players, setPlayers] = useState([]);
  const [youngGoals, setYoungGoals] = useState([]);
  const [oldGoals, setOldGoals] = useState([]);

  useEffect(() => {
    getPlayers().then(ps => {
      setPlayers(ps.sort((a, b) => a.name.localeCompare(b.name)));
    });
  }, []);

  const handleAddGoal = (team) => {
    const newGoal = { player_id: players[0]?.id || "", goals: 0, own_goals: 0 };
    if (team === "young") setYoungGoals([...youngGoals, newGoal]);
    else setOldGoals([...oldGoals, newGoal]);
  };

  const handleRemoveGoal = (team, idx) => {
    if (team === "young") setYoungGoals(youngGoals.filter((_, i) => i !== idx));
    else setOldGoals(oldGoals.filter((_, i) => i !== idx));
  };

  const handleGoalChange = (team, idx, value) => {
    if (team === "young") setYoungGoals(youngGoals.map((g, i) => i === idx ? value : g));
    else setOldGoals(oldGoals.map((g, i) => i === idx ? value : g));
  };

  // Compute scores from goalscorers
  const teamYoungScore =
    youngGoals.reduce((sum, g) => sum + Number(g.goals), 0) +
    oldGoals.reduce((sum, g) => sum + Number(g.own_goals), 0);
  const teamOldScore =
    oldGoals.reduce((sum, g) => sum + Number(g.goals), 0) +
    youngGoals.reduce((sum, g) => sum + Number(g.own_goals), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Flatten goals for API
    const goals = [
      ...youngGoals.flatMap(g => [
        ...Array(g.goals).fill({ player_id: g.player_id, is_own_goal: false, team: "young" }),
        ...Array(g.own_goals).fill({ player_id: g.player_id, is_own_goal: true, team: "young" })
      ]),
      ...oldGoals.flatMap(g => [
        ...Array(g.goals).fill({ player_id: g.player_id, is_own_goal: false, team: "old" }),
        ...Array(g.own_goals).fill({ player_id: g.player_id, is_own_goal: true, team: "old" })
      ])
    ];
    const match = {
      date,
      team_young_score: teamYoungScore,
      team_old_score: teamOldScore,
      goals,
    };
    if (onMatchAdded) await onMatchAdded(match);
    setLoading(false);
    setDate("");
    setYoungGoals([]);
    setOldGoals([]);
    onClose();
  };

  const canSubmit = date && (teamYoungScore > 0 || teamOldScore > 0);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Match</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <TextField
            label="Date"
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            fullWidth
            margin="normal"
            required
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Team Young Score"
            type="number"
            value={teamYoungScore}
            fullWidth
            margin="normal"
            InputProps={{ readOnly: true }}
          />
          <TextField
            label="Team Old Score"
            type="number"
            value={teamOldScore}
            fullWidth
            margin="normal"
            InputProps={{ readOnly: true }}
          />
          <div style={{ marginTop: 16 }}>
            <strong>Goalscorers for Team Young</strong>
            {youngGoals.map((g, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center" }}>
                <GoalInput
                  players={players}
                  value={g}
                  onChange={val => handleGoalChange("young", idx, val)}
                  team="young"
                />
                <IconButton onClick={() => handleRemoveGoal("young", idx)} size="small" color="error">
                  <RemoveIcon />
                </IconButton>
              </div>
            ))}
            <Button onClick={() => handleAddGoal("young")} startIcon={<AddIcon />} size="small" sx={{ mt: 1 }}>
              Add Scorer
            </Button>
          </div>
          <div style={{ marginTop: 16 }}>
            <strong>Goalscorers for Team Old</strong>
            {oldGoals.map((g, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center" }}>
                <GoalInput
                  players={players}
                  value={g}
                  onChange={val => handleGoalChange("old", idx, val)}
                  team="old"
                />
                <IconButton onClick={() => handleRemoveGoal("old", idx)} size="small" color="error">
                  <RemoveIcon />
                </IconButton>
              </div>
            ))}
            <Button onClick={() => handleAddGoal("old")} startIcon={<AddIcon />} size="small" sx={{ mt: 1 }}>
              Add Scorer
            </Button>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={loading || !canSubmit}>
            Add Match
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
} 