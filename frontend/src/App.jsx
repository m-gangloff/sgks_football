import React, { useState } from "react";
import PlayersPage from "./pages/PlayersPage";
import NavBar from "./components/NavBar";
import MatchesPage from "./pages/MatchesPage";

export default function App() {
  const [page, setPage] = useState("players");

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 16 }}>
      <NavBar page={page} setPage={setPage} />
      {page === "players" && <PlayersPage />}
      {page === "matches" && <MatchesPage />}
    </div>
  );
}
