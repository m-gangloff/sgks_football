import React, { useState } from "react";
import { addPlayer } from "../api";

export default function PlayerForm({ onPlayerAdded }) {
  const [name, setName] = useState("");
  const [birthdate, setBirthdate] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    await addPlayer({ name, birthdate });
    setName("");
    setBirthdate("");
    if (onPlayerAdded) onPlayerAdded();
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: 16 }}>
      <input
        required
        placeholder="Name"
        value={name}
        onChange={e => setName(e.target.value)}
      />
      <input
        required
        type="date"
        value={birthdate}
        onChange={e => setBirthdate(e.target.value)}
      />
      <button type="submit">Add Player</button>
    </form>
  );
} 