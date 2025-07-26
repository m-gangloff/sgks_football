import React from 'react';
import { Box } from '@mui/material';
import MatchForm from '../components/MatchForm';
import MatchList from '../components/MatchList';

const MatchesPage = ({ globalPassword, adminPassword, isAdminAuthenticated }) => {
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
      />
    </Box>
  );
};

export default MatchesPage; 