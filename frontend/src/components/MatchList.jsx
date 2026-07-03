import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Button,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import { getMatches, deleteAllMatches } from '../api';
import MatchModal from './MatchModal';
import SeasonSelector from './SeasonSelector';
import { seasonsFromDates, isDateInSeason } from '../utils/season';

// Compact metric tile used in the matches summary.
const StatTile = ({ label, value, color }) => (
  <Paper
    variant="outlined"
    sx={{
      p: 1.5,
      flex: '1 1 120px',
      minWidth: 100,
      textAlign: 'center',
    }}
  >
    <Typography variant="h5" sx={{ fontWeight: 'bold', color: color || 'text.primary' }}>
      {value}
    </Typography>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
  </Paper>
);

const MatchList = ({ globalPassword, adminPassword, isAdminAuthenticated, selectedSeason, onSeasonChange }) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const fetchMatches = async () => {
    try {
      const response = await getMatches(globalPassword);
      if (response.ok) {
        const data = await response.json();
        // Sort matches by date (newest first)
        const sortedMatches = data.sort((a, b) => new Date(b.date) - new Date(a.date));
        setMatches(sortedMatches);
      } else {
        setError('Failed to load matches');
      }
    } catch (error) {
      setError('Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [globalPassword]);

  // Seasons available in the data, and the matches for the selected season.
  const availableSeasons = seasonsFromDates(matches.map((m) => m.date));
  const filteredMatches = matches.filter((m) => isDateInSeason(m.date, selectedSeason));

  // Season-aware summary across the filtered matches.
  const summary = filteredMatches.reduce(
    (acc, m) => {
      acc.oldGoals += m.team_old_score;
      acc.youngGoals += m.team_young_score;
      if (m.team_old_score > m.team_young_score) acc.oldWins += 1;
      else if (m.team_young_score > m.team_old_score) acc.youngWins += 1;
      else acc.draws += 1;
      return acc;
    },
    { oldGoals: 0, youngGoals: 0, oldWins: 0, youngWins: 0, draws: 0 }
  );
  const totalGoals = summary.oldGoals + summary.youngGoals;

  const handleMatchClick = (match) => {
    setSelectedMatch(match);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedMatch(null);
  };

  const handleMatchUpdated = () => {
    fetchMatches();
    handleCloseModal();
  };

  const handleDeleteAllMatches = async () => {
    if (!window.confirm('Are you sure you want to delete ALL matches? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await deleteAllMatches(adminPassword);
      if (response.ok) {
        setMatches([]);
        alert('All matches deleted successfully!');
      } else {
        const errorData = await response.json();
        alert(errorData.detail || 'Failed to delete all matches');
      }
    } catch (error) {
      alert('Failed to delete all matches');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
          gap: 1,
          mb: 1,
        }}
      >
        <Typography variant="h5" gutterBottom sx={{ mb: 0 }}>
          Matches ({filteredMatches.length})
        </Typography>
        <SeasonSelector
          value={selectedSeason}
          onChange={onSeasonChange}
          seasons={availableSeasons}
        />
      </Box>

      {isAdminAuthenticated && (
        <Button
          variant="outlined"
          color="error"
          onClick={handleDeleteAllMatches}
          sx={{ mb: 2 }}
        >
          Delete All Matches
        </Button>
      )}

      {filteredMatches.length === 0 ? (
        <Typography variant="body1" color="text.secondary">
          {matches.length === 0
            ? `No matches found. ${isAdminAuthenticated ? 'Add some matches to get started!' : 'Contact an admin to add matches.'}`
            : 'No matches in this season. Try selecting a different season.'}
        </Typography>
      ) : (
        <>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1,
              mb: 2,
            }}
          >
            <StatTile label="Matches" value={filteredMatches.length} />
            <StatTile label="Team Old Wins" value={summary.oldWins} />
            <StatTile label="Team Young Wins" value={summary.youngWins} />
            <StatTile label="Draws" value={summary.draws} />
            <StatTile label="Total Goals" value={totalGoals} />
            <StatTile label="Team Old Goals" value={summary.oldGoals} />
            <StatTile label="Team Young Goals" value={summary.youngGoals} />
          </Box>

          <TableContainer component={Paper}>
            <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'action.hover' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'action.hover' }}>Winner</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'action.hover' }}>Score Team Old</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'action.hover' }}>Score Team Young</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'action.hover' }}>Goal Diff</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'action.hover' }}>Total Goals</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredMatches.map((match) => {
                const goalDifference = Math.abs(match.team_old_score - match.team_young_score);
                const totalGoals = match.team_old_score + match.team_young_score;
                const winner =
                  match.team_old_score > match.team_young_score
                    ? 'Team Old'
                    : match.team_young_score > match.team_old_score
                    ? 'Team Young'
                    : 'Draw';

                return (
                  <TableRow
                    key={match.id}
                    onClick={() => handleMatchClick(match)}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    <TableCell>{match.date}</TableCell>
                    <TableCell>{winner}</TableCell>
                    <TableCell>{match.team_old_score}</TableCell>
                    <TableCell>{match.team_young_score}</TableCell>
                    <TableCell>{goalDifference}</TableCell>
                    <TableCell>{totalGoals}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {selectedMatch && (
        <MatchModal
          open={showModal}
          onClose={handleCloseModal}
          match={selectedMatch}
          globalPassword={globalPassword}
          adminPassword={adminPassword}
          isAdminAuthenticated={isAdminAuthenticated}
          onMatchUpdated={handleMatchUpdated}
        />
      )}
    </Box>
  );
};

export default MatchList; 