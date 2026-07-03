import React from 'react';
import { Box } from '@mui/material';
import MatchForm from '../components/MatchForm';
import MatchList from '../components/MatchList';

const MatchesPage = ({ globalPassword, adminPassword, isAdminAuthenticated, selectedSeason, onSeasonChange }) => {
  return (
    <Box>
      <MatchForm
        globalPassword={globalPassword}
        isAdminAuthenticated={isAdminAuthenticated}
      />
      <MatchList
        globalPassword={globalPassword}
        adminPassword={adminPassword}
        isAdminAuthenticated={isAdminAuthenticated}
        selectedSeason={selectedSeason}
        onSeasonChange={onSeasonChange}
      />
    </Box>
  );
};

export default MatchesPage; 