import React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";

export default function MatchModal({ open, onClose, match }) {
  if (!match) return null;

  // Separate goals by team
  const goalsYoung = (match.goals || []).filter(g => g.team === "young");
  const goalsOld = (match.goals || []).filter(g => g.team === "old");

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Match Details</DialogTitle>
      <DialogContent>
        <Typography variant="h6">Date: {match.date}</Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Score: Young {match.team_young_score} : {match.team_old_score} Old
        </Typography>
        <Typography variant="subtitle1">Goals for Team Young</Typography>
        <TableContainer component={Paper} sx={{ mb: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Player</TableCell>
                <TableCell>Own Goal?</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {goalsYoung.map((g, idx) => (
                <TableRow key={idx}>
                  <TableCell>{g.player?.name || g.player_id}</TableCell>
                  <TableCell>{g.is_own_goal ? "Yes" : "No"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Typography variant="subtitle1">Goals for Team Old</Typography>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Player</TableCell>
                <TableCell>Own Goal?</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {goalsOld.map((g, idx) => (
                <TableRow key={idx}>
                  <TableCell>{g.player?.name || g.player_id}</TableCell>
                  <TableCell>{g.is_own_goal ? "Yes" : "No"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
} 