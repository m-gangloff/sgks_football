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

const MatchList = ({ globalPassword, adminPassword, isAdminAuthenticated }) => {
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
      <Typography variant="h5" gutterBottom>
        Matches ({matches.length})
      </Typography>

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

      {matches.length === 0 ? (
        <Typography variant="body1" color="text.secondary">
          No matches found. {isAdminAuthenticated ? 'Add some matches to get started!' : 'Contact an admin to add matches.'}
        </Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'action.hover' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'action.hover' }}>Team Old Score</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'action.hover' }}>Team Young Score</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'action.hover' }}>Goal Difference</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'action.hover' }}>Total Goals</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {matches.map((match) => {
                const goalDifference = Math.abs(match.team_old_score - match.team_young_score);
                const totalGoals = match.team_old_score + match.team_young_score;
                
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
      )}

      {selectedMatch && (
        <MatchModal
          open={showModal}
          onClose={handleCloseModal}
          match={selectedMatch}
          adminPassword={adminPassword}
          isAdminAuthenticated={isAdminAuthenticated}
          onMatchUpdated={handleMatchUpdated}
        />
      )}
    </Box>
  );
};

export default MatchList; 