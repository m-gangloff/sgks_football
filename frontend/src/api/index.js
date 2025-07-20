const API_URL = "http://localhost:8000";

export async function getPlayers() {
  const res = await fetch(`${API_URL}/players/`);
  return res.json();
}

export async function addPlayer(player) {
  const res = await fetch(`${API_URL}/players/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(player),
  });
  return res.json();
}

export async function updatePlayer(id, player) {
  const res = await fetch(`${API_URL}/players/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(player),
  });
  return res.json();
}

export async function deletePlayer(id) {
  await fetch(`${API_URL}/players/${id}`, {
    method: "DELETE",
  });
}

export async function deleteAllPlayers() {
  await fetch(`${API_URL}/players/`, {
    method: "DELETE",
  });
}

export async function getMatches() {
  const res = await fetch(`${API_URL}/matches/`);
  return res.json();
}

export async function addMatch(match) {
  const res = await fetch(`${API_URL}/matches/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(match),
  });
  return res.json();
}

export async function addDefaultPlayers() {
  await fetch(`${API_URL}/players/defaults`, {
    method: "POST",
  });
}

export async function deleteAllMatches() {
  await fetch(`${API_URL}/matches/`, {
    method: "DELETE",
  });
}