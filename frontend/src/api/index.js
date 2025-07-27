const API_URL = import.meta.env.VITE_API_URL;

// Helper function to get auth headers
const getAuthHeaders = (globalPassword, adminPassword = null) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (globalPassword) {
    headers['X-Global-Password'] = globalPassword;
  }
  
  if (adminPassword) {
    headers['X-Admin-Password'] = adminPassword;
  }
  
  return headers;
};

// Authentication functions
export const authenticateGlobal = async (password) => {
  const response = await fetch(`${API_URL}/auth/global`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password }),
  });
  return response;
};

export const authenticateAdmin = async (password) => {
  const response = await fetch(`${API_URL}/auth/admin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password }),
  });
  return response;
};

// Player functions
export const getPlayers = async (globalPassword) => {
  const response = await fetch(`${API_URL}/players/`, {
    headers: getAuthHeaders(globalPassword),
  });
  return response;
};

export const createPlayer = async (player, globalPassword) => {
  const response = await fetch(`${API_URL}/players/`, {
    method: 'POST',
    headers: getAuthHeaders(globalPassword),
    body: JSON.stringify(player),
  });
  return response;
};

export const updatePlayer = async (id, player, adminPassword) => {
  const response = await fetch(`${API_URL}/players/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(null, adminPassword),
    body: JSON.stringify(player),
  });
  return response;
};

export const deletePlayer = async (id, adminPassword) => {
  const response = await fetch(`${API_URL}/players/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(null, adminPassword),
  });
  return response;
};

// Unknown player management
export const getUnknownPlayerGoals = async (globalPassword) => {
  const response = await fetch(`${API_URL}/unknown-player/goals`, {
    headers: getAuthHeaders(globalPassword),
  });
  return response;
};

export const reassignGoals = async (goalIds, newPlayerId, adminPassword) => {
  const response = await fetch(`${API_URL}/unknown-player/reassign`, {
    method: 'POST',
    headers: getAuthHeaders(null, adminPassword),
    body: JSON.stringify({
      goal_ids: goalIds,
      new_player_id: newPlayerId
    }),
  });
  return response;
};

export const deleteAllPlayers = async (adminPassword) => {
  const response = await fetch(`${API_URL}/players/`, {
    method: 'DELETE',
    headers: getAuthHeaders(null, adminPassword),
  });
  return response;
};

export const addDefaultPlayers = async (adminPassword) => {
  const response = await fetch(`${API_URL}/players/defaults`, {
    method: 'POST',
    headers: getAuthHeaders(null, adminPassword),
  });
  return response;
};

// Match functions
export const getMatches = async (globalPassword) => {
  const response = await fetch(`${API_URL}/matches/`, {
    headers: getAuthHeaders(globalPassword),
  });
  return response;
};

export const createMatch = async (match, globalPassword) => {
  const response = await fetch(`${API_URL}/matches/`, {
    method: 'POST',
    headers: getAuthHeaders(globalPassword),
    body: JSON.stringify(match),
  });
  return response;
};

export const updateMatch = async (id, match, adminPassword) => {
  const response = await fetch(`${API_URL}/matches/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(null, adminPassword),
    body: JSON.stringify(match),
  });
  return response;
};

export const deleteMatch = async (id, adminPassword) => {
  const response = await fetch(`${API_URL}/matches/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(null, adminPassword),
  });
  return response;
};

export const deleteAllMatches = async (adminPassword) => {
  const response = await fetch(`${API_URL}/matches/`, {
    method: 'DELETE',
    headers: getAuthHeaders(null, adminPassword),
  });
  return response;
};

// Backup functions
export const createBackup = async (adminPassword) => {
  const response = await fetch(`${API_URL}/backup/`, {
    method: 'POST',
    headers: getAuthHeaders(null, adminPassword),
  });
  return response;
};

export const listBackups = async (globalPassword) => {
  const response = await fetch(`${API_URL}/backups/`, {
    headers: getAuthHeaders(globalPassword),
  });
  return response;
};