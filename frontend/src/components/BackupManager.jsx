import React, { useState, useEffect } from 'react';
import {
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  Box,
  Alert,
  CircularProgress,
  Paper
} from '@mui/material';
import { createBackup, listBackups } from '../api';

const BackupManager = ({ globalPassword, adminPassword, isAdminAuthenticated }) => {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [error, setError] = useState('');

  const fetchBackups = async () => {
    try {
      const response = await listBackups(globalPassword);
      if (response.ok) {
        const data = await response.json();
        setBackups(data.backups || []);
      } else {
        setError('Failed to load backups');
      }
    } catch (error) {
      setError('Failed to load backups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, [globalPassword]);

  const handleCreateBackup = async () => {
    setCreatingBackup(true);
    setError('');
    
    try {
      const response = await createBackup(adminPassword);
      
      if (response.ok) {
        // Get the filename from the response headers, falling back to a
        // timestamped name if the header isn't readable (e.g. not exposed).
        const contentDisposition = response.headers.get('content-disposition');
        const ts = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '');
        let filename = `football_backup_${ts}.db`;
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
        }
        
        // Create a blob and download the file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        await fetchBackups(); // Refresh the list
        alert("Backup created and downloaded successfully!");
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to create backup');
      }
    } catch (error) {
      setError('Failed to create backup: ' + error.message);
    } finally {
      setCreatingBackup(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Database Backups
      </Typography>

      <Button
        variant="contained"
        onClick={handleCreateBackup}
        disabled={creatingBackup}
        sx={{ mb: 3 }}
      >
        {creatingBackup ? 'Creating Backup...' : 'Create New Backup'}
      </Button>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Typography variant="h6" gutterBottom>
        Available Backups ({backups.length})
      </Typography>

      {backups.length === 0 ? (
        <Typography variant="body1" color="text.secondary">
          No backups found. Create your first backup!
        </Typography>
      ) : (
        <Paper>
          <List>
            {backups.map((backup, index) => (
              <ListItem key={index} divider={index < backups.length - 1}>
                <ListItemText
                  primary={backup.filename}
                  secondary={
                    <>
                      <Typography variant="body2" color="text.secondary" component="span" display="block">
                        Size: {formatFileSize(backup.size_bytes)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" component="span" display="block">
                        Created: {formatDate(backup.created)}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      <Box sx={{ mt: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" gutterBottom>
          About Backups
        </Typography>
        <Typography variant="body2" paragraph>
          Each backup is a portable SQLite snapshot of the database at the moment
          you click <strong>Create New Backup</strong>, downloaded straight to your device.
        </Typography>
        <Typography variant="body2" paragraph>
          To restore, an admin re-imports a snapshot into the live database using the
          <code> migrate_db.py</code> script with the backup file as the source (see the
          project README, “Restoring Backups”). Keep a snapshot after each match so you
          always have a recent copy.
        </Typography>
      </Box>
    </Box>
  );
};

export default BackupManager; 