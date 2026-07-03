import React from 'react';
import { Box } from '@mui/material';
import PlayerForm from '../components/PlayerForm';
import PlayerList from '../components/PlayerList';

const PlayersPage = ({ globalPassword, adminPassword, isAdminAuthenticated, selectedSeason, onSeasonChange }) => {
  return (
    <Box>
      <PlayerForm
        globalPassword={globalPassword}
        isAdminAuthenticated={isAdminAuthenticated}
      />
      <PlayerList
        globalPassword={globalPassword}
        adminPassword={adminPassword}
        isAdminAuthenticated={isAdminAuthenticated}
        selectedSeason={selectedSeason}
        onSeasonChange={onSeasonChange}
      />
    </Box>
  );
};

export default PlayersPage; 