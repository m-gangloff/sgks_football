import React from "react";

export default function NavBar({ page, setPage }) {
  return (
    <nav style={{ marginBottom: 24 }}>
      <button onClick={() => setPage("players")} disabled={page === "players"}>Players</button>
      <button onClick={() => setPage("matches")} disabled={page === "matches"}>Matches</button>
    </nav>
  );
} 