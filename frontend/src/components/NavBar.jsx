import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tabs,
  Tab,
  IconButton,
  Chip,
  Divider,
} from '@mui/material';
import {
  AdminPanelSettings,
  Logout,
  DarkMode,
  LightMode,
  AccountCircle,
  SportsSoccer,
} from '@mui/icons-material';

const NavBar = ({
  currentPage,
  onPageChange,
  isAdminAuthenticated,
  onLogout,
  onLogoutAdmin,
  onEnableAdmin,
  darkMode,
  onToggleDarkMode,
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const withClose = (fn) => () => {
    handleClose();
    fn();
  };

  return (
    <AppBar
      position="sticky"
      color="default"
      sx={{
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Toolbar sx={{ gap: { xs: 1, sm: 2 }, minHeight: { xs: 56, sm: 64 } }}>
        {/* Brand */}
        <SportsSoccer color="primary" />
        <Typography
          variant="h6"
          noWrap
          sx={{
            fontWeight: 700,
            display: { xs: 'none', sm: 'block' },
          }}
        >
          SGKS Football
        </Typography>

        {/* Navigation tabs */}
        <Tabs
          value={currentPage}
          onChange={(e, value) => onPageChange(value)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{ flexGrow: 1, ml: { sm: 2 }, minHeight: 48 }}
        >
          <Tab label="Players" value="players" />
          <Tab label="Matches" value="matches" />
          {isAdminAuthenticated && <Tab label="Backups" value="backups" />}
        </Tabs>

        {/* Account */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isAdminAuthenticated && (
            <Chip
              label="Admin"
              size="small"
              color="primary"
              variant="outlined"
              sx={{ display: { xs: 'none', sm: 'flex' } }}
            />
          )}
          <IconButton
            onClick={handleClick}
            color={isAdminAuthenticated ? 'primary' : 'default'}
            aria-controls={open ? 'account-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={open ? 'true' : undefined}
          >
            <AccountCircle />
          </IconButton>
        </Box>

        <Menu
          id="account-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          slotProps={{
            paper: {
              elevation: 3,
              sx: { mt: 1.5, minWidth: 200, borderRadius: 2 },
            },
          }}
        >
          {!isAdminAuthenticated ? (
            <MenuItem onClick={withClose(onEnableAdmin)}>
              <ListItemIcon>
                <AdminPanelSettings fontSize="small" />
              </ListItemIcon>
              <ListItemText>Login Admin</ListItemText>
            </MenuItem>
          ) : (
            <MenuItem onClick={withClose(onLogoutAdmin)}>
              <ListItemIcon>
                <AdminPanelSettings fontSize="small" color="primary" />
              </ListItemIcon>
              <ListItemText>Logout Admin</ListItemText>
            </MenuItem>
          )}

          <MenuItem onClick={withClose(onToggleDarkMode)}>
            <ListItemIcon>
              {darkMode ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
            </ListItemIcon>
            <ListItemText>{darkMode ? 'Light mode' : 'Dark mode'}</ListItemText>
          </MenuItem>

          <Divider />

          <MenuItem onClick={withClose(onLogout)}>
            <ListItemIcon>
              <Logout fontSize="small" />
            </ListItemIcon>
            <ListItemText>Logout</ListItemText>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default NavBar;
