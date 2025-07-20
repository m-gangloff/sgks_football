import React, { useState } from "react";
import PlayerList from "../components/PlayerList";
import PlayerForm from "../components/PlayerForm";

export default function PlayersPage() {
  const [refresh, setRefresh] = useState(false);

  return (
    <div>
      <h1>Players</h1>
      <PlayerForm onPlayerAdded={() => setRefresh(r => !r)} />
      <PlayerList key={refresh} />
    </div>
  );
} 