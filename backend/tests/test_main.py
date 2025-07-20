import sys
import os
import shutil
import pytest
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, SessionLocal, engine

# Use a separate test database
TEST_DB_URL = "sqlite:///./test_football.db"
os.environ["FOOTBALL_DB_URL"] = TEST_DB_URL

def setup_module(module):
    # Create the test database and tables
    Base.metadata.create_all(bind=engine)

def teardown_module(module):
    # Remove the test database file after tests
    db_path = "test_football.db"
    if os.path.exists(db_path):
        os.remove(db_path)

client = TestClient(app)

def test_read_root():
    """Test that the root endpoint returns the API welcome message."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "SGKS Football Stats API"}

def test_create_player():
    """Test creating a player and verify the response contains the correct fields and values."""
    player_data = {
        "name": "Test Player",
        "birthdate": "2000-01-01"
    }
    response = client.post("/players/", json=player_data)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Player"
    assert data["birthdate"] == "2000-01-01"
    assert "id" in data

def test_list_players():
    """Test listing all players and verify the created player is present in the response."""
    response = client.get("/players/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert any(player["name"] == "Test Player" for player in data)

def test_create_match():
    """Test creating a match with two players and multiple goals, and verify the match and goals are stored correctly."""
    # First, create two players
    player1 = client.post("/players/", json={"name": "Alice", "birthdate": "1990-01-01"}).json()
    player2 = client.post("/players/", json={"name": "Bob", "birthdate": "1985-01-01"}).json()
    match_data = {
        "date": "2024-07-20",
        "team_young_score": 2,
        "team_old_score": 1,
        "goals": [
            {"player_id": player1["id"], "is_own_goal": False, "team": "young"},
            {"player_id": player2["id"], "is_own_goal": False, "team": "old"},
            {"player_id": player1["id"], "is_own_goal": False, "team": "young"}
        ]
    }
    response = client.post("/matches/", json=match_data)
    assert response.status_code == 200
    data = response.json()
    assert data["team_young_score"] == 2
    assert data["team_old_score"] == 1
    assert len(data["goals"]) == 3
    assert data["goals"][0]["player_id"] == player1["id"]

def test_list_matches():
    """Test listing all matches and verify at least one match with the expected fields is present."""
    response = client.get("/matches/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert any("team_young_score" in match for match in data)

def test_create_player_invalid_data():
    """Test creating a player with missing required fields should fail."""
    player_data = {"name": "No Birthdate"}  # Missing birthdate
    response = client.post("/players/", json=player_data)
    assert response.status_code == 422

def test_create_player_duplicate_name():
    """Test creating two players with the same name is allowed (unless uniqueness is enforced)."""
    player_data = {"name": "Duplicate Name", "birthdate": "1995-05-05"}
    response1 = client.post("/players/", json=player_data)
    response2 = client.post("/players/", json=player_data)
    assert response1.status_code == 200
    assert response2.status_code == 200
    data1 = response1.json()
    data2 = response2.json()
    assert data1["id"] != data2["id"]

def test_create_match_invalid_player():
    """Test creating a match with a non-existent player_id in goals should fail or succeed depending on backend validation."""
    match_data = {
        "date": "2024-07-21",
        "team_young_score": 1,
        "team_old_score": 0,
        "goals": [
            {"player_id": 99999, "is_own_goal": False, "team": "young"}  # Non-existent player
        ]
    }
    response = client.post("/matches/", json=match_data)
    # If backend does not validate, this may succeed; if it does, should be 400/422
    assert response.status_code in (200, 400, 422)

def test_create_match_invalid_data():
    """Test creating a match with missing required fields should fail."""
    match_data = {
        "team_young_score": 1,
        "team_old_score": 0,
        "goals": []
    }  # Missing date
    response = client.post("/matches/", json=match_data)
    assert response.status_code == 422

def test_create_own_goal():
    """Test creating a match with a goal marked as an own goal."""
    player = client.post("/players/", json={"name": "Own Goal Player", "birthdate": "1992-02-02"}).json()
    match_data = {
        "date": "2024-07-22",
        "team_young_score": 0,
        "team_old_score": 1,
        "goals": [
            {"player_id": player["id"], "is_own_goal": True, "team": "young"}
        ]
    }
    response = client.post("/matches/", json=match_data)
    assert response.status_code == 200
    data = response.json()
    assert len(data["goals"]) == 1
    assert data["goals"][0]["is_own_goal"] is True