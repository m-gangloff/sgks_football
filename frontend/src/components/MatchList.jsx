import React, { useEffect, useState } from "react";
import { getMatches, addMatch, deleteAllMatches } from "../api";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import MatchModal from "./MatchModal";
import MatchForm from "./MatchForm";
import Button from "@mui/material/Button";
import TableSortLabel from "@mui/material/TableSortLabel";

const columns = [
  { id: "date", label: "Date" },
  { id: "team_old_score", label: "Team Old Score (Old)" },
  { id: "team_young_score", label: "Team Young Score (Young)" },
  { id: "goal_diff", label: "Goal Difference" },
];

function descendingComparator(a, b, orderBy) {
  if (orderBy === "date") {
    return new Date(b.date) - new Date(a.date);
  }
  if (orderBy === "goal_diff") {
    const diffA = Math.abs(a.team_old_score - a.team_young_score);
    const diffB = Math.abs(b.team_old_score - b.team_young_score);
    return diffB - diffA;
  }
  if (b[orderBy] < a[orderBy]) return -1;
  if (b[orderBy] > a[orderBy]) return 1;
  return 0;
}

function ascendingComparator(a, b, orderBy) {
  if (orderBy === "date") {
    return new Date(a.date) - new Date(b.date);
  }
  if (orderBy === "goal_diff") {
    const diffA = Math.abs(a.team_old_score - a.team_young_score);
    const diffB = Math.abs(b.team_old_score - b.team_young_score);
    return diffA - diffB;
  }
  if (a[orderBy] < b[orderBy]) return -1;
  if (a[orderBy] > b[orderBy]) return 1;
  return 0;
}

export default function MatchList() {
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [orderBy, setOrderBy] = useState("date");
  const [order, setOrder] = useState("desc");

  const fetchMatches = () => {
    getMatches().then(setMatches);
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const handleRowClick = (match) => {
    setSelectedMatch(match);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedMatch(null);
  };

  const handleFormOpen = () => setFormOpen(true);
  const handleFormClose = () => setFormOpen(false);

  const handleAddMatch = async (match) => {
    await addMatch(match);
    fetchMatches();
  };

  const handleDeleteAll = async () => {
    if (window.confirm("Are you sure you want to delete ALL matches? This cannot be undone.")) {
      await deleteAllMatches();
      fetchMatches();
    }
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const sortedMatches = [...matches].sort((a, b) => {
    if (order === "desc") return descendingComparator(a, b, orderBy);
    return ascendingComparator(a, b, orderBy);
  });

  return (
    <div>
      <h2>Matches</h2>
      <Button variant="contained" onClick={handleFormOpen} sx={{ mb: 2, mr: 2 }}>
        Add Match
      </Button>
      <Button variant="contained" color="error" onClick={handleDeleteAll} sx={{ mb: 2 }}>
        Delete All Matches
      </Button>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell key={col.id} sortDirection={orderBy === col.id ? order : false}>
                  <TableSortLabel
                    active={orderBy === col.id}
                    direction={orderBy === col.id ? order : "asc"}
                    onClick={() => handleRequestSort(col.id)}
                  >
                    {col.label}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedMatches.map((m) => (
              <TableRow key={m.id} hover style={{ cursor: "pointer" }} onClick={() => handleRowClick(m)}>
                <TableCell>{m.date}</TableCell>
                <TableCell>{m.team_old_score}</TableCell>
                <TableCell>{m.team_young_score}</TableCell>
                <TableCell>{Math.abs(m.team_old_score - m.team_young_score)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <MatchModal
        open={modalOpen}
        onClose={handleModalClose}
        match={selectedMatch}
      />
      <MatchForm
        open={formOpen}
        onClose={handleFormClose}
        onMatchAdded={handleAddMatch}
      />
    </div>
  );
} 