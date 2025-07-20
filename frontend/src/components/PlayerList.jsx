import React, { useEffect, useState } from "react";
import { getPlayers, deleteAllPlayers, addDefaultPlayers } from "../api";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import PlayerModal from "./PlayerModal";
import Button from "@mui/material/Button";

export default function PlayerList() {
  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchPlayers = () => {
    getPlayers().then(setPlayers);
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

  const handlePlayerClick = (player) => {
    setSelectedPlayer(player);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedPlayer(null);
  };

  const handleDeleteAll = async () => {
    if (window.confirm("Are you sure you want to delete ALL players? This cannot be undone.")) {
      await deleteAllPlayers();
      fetchPlayers();
    }
  };

  const handleAddDefaults = async () => {
    await addDefaultPlayers();
    fetchPlayers();
  };

  // Sort players by number of non-own goals (descending)
  const sortedPlayers = [...players].sort((a, b) => {
    const goalsA = Array.isArray(a.goals) ? a.goals.filter(g => !g.is_own_goal).length : 0;
    const goalsB = Array.isArray(b.goals) ? b.goals.filter(g => !g.is_own_goal).length : 0;
    return goalsB - goalsA;
  });

  return (
    <div>
      <h2>Players</h2>
      <Button variant="contained" color="error" onClick={handleDeleteAll} sx={{ mb: 2 }}>
        Delete All Players
      </Button>
      <Button variant="contained" onClick={handleAddDefaults} sx={{ mb: 2, ml: 2 }}>
        Add Default Players
      </Button>
      <List>
        {sortedPlayers.map((p) => {
          const goals = Array.isArray(p.goals) ? p.goals.filter(g => !g.is_own_goal).length : 0;
          return (
            <ListItem key={p.id} disablePadding>
              <ListItemButton onClick={() => handlePlayerClick(p)}>
                <ListItemText
                  primary={`${p.name} (${p.birthdate}) - ${goals} goal${goals === 1 ? '' : 's'}`}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      <PlayerModal
        open={modalOpen}
        onClose={handleModalClose}
        player={selectedPlayer}
        onUpdated={fetchPlayers}
        onDeleted={fetchPlayers}
      />
    </div>
  );
} 