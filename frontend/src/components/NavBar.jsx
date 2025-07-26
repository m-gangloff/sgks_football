import React, { useState } from 'react';
import { AppBar, Toolbar, Button, Typography, Box, Menu, MenuItem, ListItemIcon, ListItemText, Switch, FormControlLabel } from '@mui/material';
import { ExpandMore, AdminPanelSettings, Logout, Settings, DarkMode, LightMode } from '@mui/icons-material';

const NavBar = ({ currentPage, onPageChange, isAdminAuthenticated, onLogout, onLogoutAdmin, onEnableAdmin, darkMode, onToggleDarkMode }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    onLogout();
  };

  const handleLogoutAdmin = () => {
    handleClose();
    onLogoutAdmin();
  };

  const handleEnableAdmin = () => {
    handleClose();
    onEnableAdmin();
  };

  return (
    <AppBar position="static" sx={{ mb: 3 }}>
      <Toolbar sx={{ 
        display: 'flex', 
        alignItems: 'center',
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 1, sm: 0 }
      }}>
        {/* Left: Title */}
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            flexGrow: 0, 
            mr: { sm: 2 },
            textAlign: { xs: 'center', sm: 'left' }
          }}
        >
          SGKS Football Stats
        </Typography>
        
        {/* Center: Navigation Buttons */}
        <Box sx={{ 
          display: 'flex', 
          gap: { xs: 0.5, sm: 1 }, 
          flexGrow: 1, 
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <Button 
            color="inherit" 
            onClick={() => onPageChange('players')}
            variant={currentPage === 'players' ? 'outlined' : 'text'}
            size="small"
          >
            Players
          </Button>
          <Button 
            color="inherit" 
            onClick={() => onPageChange('matches')}
            variant={currentPage === 'matches' ? 'outlined' : 'text'}
            size="small"
          >
            Matches
          </Button>
          {isAdminAuthenticated && (
            <Button 
              color="inherit" 
              onClick={() => onPageChange('backups')}
              variant={currentPage === 'backups' ? 'outlined' : 'text'}
              size="small"
            >
              Backups
            </Button>
          )}
        </Box>
        
        {/* Right: Account Button */}
        <Box sx={{ flexGrow: 0, ml: { sm: 2 } }}>
          <Button
            color="inherit"
            onClick={handleClick}
            variant="outlined"
            size="small"
            endIcon={<ExpandMore />}
            aria-controls={open ? 'account-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={open ? 'true' : undefined}
            sx={{
              ...(isAdminAuthenticated && {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderColor: 'rgba(255, 255, 255, 0.3)',
              })
            }}
          >
            {isAdminAuthenticated ? 'Admin' : 'Account'}
          </Button>
          
          <Menu
            id="account-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            onClick={handleClose}
            PaperProps={{
              elevation: 0,
              sx: {
                overflow: 'visible',
                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                mt: 1.5,
                '& .MuiAvatar-root': {
                  width: 32,
                  height: 32,
                  ml: -0.5,
                  mr: 1,
                },
                '&:before': {
                  content: '""',
                  display: 'block',
                  position: 'absolute',
                  top: 0,
                  right: 14,
                  width: 10,
                  height: 10,
                  bgcolor: 'background.paper',
                  transform: 'translateY(-50%) rotate(45deg)',
                  zIndex: 0,
                },
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            {!isAdminAuthenticated ? (
              <MenuItem onClick={handleEnableAdmin}>
                <ListItemIcon>
                  <AdminPanelSettings fontSize="small" />
                </ListItemIcon>
                <ListItemText>Login Admin</ListItemText>
              </MenuItem>
            ) : (
              <MenuItem onClick={handleLogoutAdmin}>
                <ListItemIcon>
                  <AdminPanelSettings fontSize="small" />
                </ListItemIcon>
                <ListItemText>Logout Admin</ListItemText>
              </MenuItem>
            )}
            
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              <ListItemText>Logout</ListItemText>
            </MenuItem>
            
            <MenuItem onClick={onToggleDarkMode}>
              <ListItemIcon>
                {darkMode ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
              </ListItemIcon>
              <ListItemText>
                <FormControlLabel
                  control={
                    <Switch
                      checked={darkMode}
                      onChange={onToggleDarkMode}
                      size="small"
                    />
                  }
                  label={darkMode ? 'Light Mode' : 'Dark Mode'}
                  sx={{ margin: 0 }}
                />
              </ListItemText>
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default NavBar; 