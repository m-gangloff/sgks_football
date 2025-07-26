import os
import shutil
from fastapi import FastAPI, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from . import schemas, crud, database
from typing import List
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from . import models
from datetime import datetime
from fastapi.responses import FileResponse
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Environment variables for passwords
GLOBAL_PASSWORD = os.getenv("GLOBAL_PASSWORD")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")

# Validate that required environment variables are set
if not GLOBAL_PASSWORD:
    raise ValueError("GLOBAL_PASSWORD environment variable is required. Please set it in your .env file.")
if not ADMIN_PASSWORD:
    raise ValueError("ADMIN_PASSWORD environment variable is required. Please set it in your .env file.")

@asynccontextmanager
async def lifespan(app):
    database.init_db()
    yield

app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or ["http://localhost:5173"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Authentication dependencies
def verify_global_password(password: str):
    if password != GLOBAL_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect global password"
        )
    return True

def verify_admin_password(password: str):
    if password != ADMIN_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect admin password"
        )
    return True

def get_global_auth(x_global_password: str = Header(None)):
    if not x_global_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Global password required"
        )
    return verify_global_password(x_global_password)

def get_admin_auth(x_admin_password: str = Header(None)):
    if not x_admin_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin password required"
        )
    return verify_admin_password(x_admin_password)

# Dependency
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()


class PasswordRequest(BaseModel):
    password: str

@app.get("/")
def read_root():
    return {"message": "SGKS Football Stats API"}

# Authentication endpoints
@app.post("/auth/global")
def authenticate_global(request: PasswordRequest):
    """Authenticate with global password to access the app."""
    verify_global_password(request.password)
    return {"message": "Global authentication successful"}

@app.post("/auth/admin")
def authenticate_admin(request: PasswordRequest):
    """Authenticate with admin password to enable editing."""
    verify_admin_password(request.password)
    return {"message": "Admin authentication successful"}

@app.post("/players/", response_model=schemas.Player)
def create_player(player: schemas.PlayerCreate, db: Session = Depends(get_db), global_auth: bool = Depends(get_global_auth)):
    result = crud.create_player(db=db, player=player)
    if result is None:
        raise HTTPException(status_code=400, detail="A player with this name already exists")
    return result

@app.get("/players/", response_model=List[schemas.Player])
def read_players(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), global_auth: bool = Depends(get_global_auth)):
    return crud.get_players(db, skip=skip, limit=limit)

@app.put("/players/{player_id}", response_model=schemas.Player)
def update_player(player_id: int, player: schemas.PlayerCreate, db: Session = Depends(get_db), admin_auth: bool = Depends(get_admin_auth)):
    db_player = crud.get_player(db, player_id)
    if not db_player:
        raise HTTPException(status_code=404, detail="Player not found")
    db_player.name = player.name
    db_player.birthdate = player.birthdate
    db.commit()
    db.refresh(db_player)
    return db_player

@app.delete("/players/{player_id}")
def delete_player(player_id: int, db: Session = Depends(get_db), admin_auth: bool = Depends(get_admin_auth)):
    result = crud.delete_player(db, player_id)
    if result is None:
        # Check if it's because the player doesn't exist or because it's the unknown player
        player = crud.get_player(db, player_id)
        if not player:
            raise HTTPException(status_code=404, detail="Player not found")
        elif player.name == "Unknown Player (Deleted)":
            raise HTTPException(status_code=400, detail="Cannot delete the Unknown Player")
        else:
            raise HTTPException(status_code=404, detail="Player not found")
    return result

@app.delete("/players/", status_code=204)
def delete_all_players(db: Session = Depends(get_db), admin_auth: bool = Depends(get_admin_auth)):
    db.query(models.Goal).delete()
    db.query(models.Player).delete()
    db.commit()
    return

@app.post("/matches/", response_model=schemas.Match)
def create_match(match: schemas.MatchCreate, db: Session = Depends(get_db), global_auth: bool = Depends(get_global_auth)):
    return crud.create_match(db=db, match=match)

@app.get("/matches/", response_model=List[schemas.Match])
def read_matches(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), global_auth: bool = Depends(get_global_auth)):
    return crud.get_matches(db, skip=skip, limit=limit)

@app.put("/matches/{match_id}", response_model=schemas.Match)
def update_match(match_id: int, match: schemas.MatchCreate, db: Session = Depends(get_db), admin_auth: bool = Depends(get_admin_auth)):
    db_match = crud.get_match(db, match_id)
    if not db_match:
        raise HTTPException(status_code=404, detail="Match not found")
    
    # Update match details
    db_match.date = match.date
    db_match.team_young_score = match.team_young_score
    db_match.team_old_score = match.team_old_score
    
    # Delete existing goals and add new ones
    db.query(models.Goal).filter(models.Goal.match_id == match_id).delete()
    
    for goal in match.goals:
        db_goal = models.Goal(
            match_id=match_id,
            player_id=goal.player_id,
            is_own_goal=goal.is_own_goal,
            team=goal.team
        )
        db.add(db_goal)
    
    db.commit()
    db.refresh(db_match)
    return db_match

@app.delete("/matches/{match_id}")
def delete_match(match_id: int, db: Session = Depends(get_db), admin_auth: bool = Depends(get_admin_auth)):
    result = crud.delete_match(db, match_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Match not found")
    return result

@app.delete("/matches/", status_code=204)
def delete_all_matches(db: Session = Depends(get_db), admin_auth: bool = Depends(get_admin_auth)):
    db.query(models.Goal).delete()
    db.query(models.Match).delete()
    db.commit()
    return

@app.post("/players/defaults", status_code=201)
def add_default_players(db: Session = Depends(get_db), admin_auth: bool = Depends(get_admin_auth)):
    default_players = [
        {"name": "Adrian Huck", "birthdate": "2007-10-02"},
        {"name": "Ferdi Forcher", "birthdate": "1995-03-21"},
        {"name": "Johannes Boos", "birthdate": "2002-08-25"},
        {"name": "Tom Altmann", "birthdate": "2007-01-12"},
        {"name": "Linus Eberle", "birthdate": "2005-03-12"},
        {"name": "Kaj Leimgruber", "birthdate": "2006-08-18"},
        {"name": "Maximilian Gangloff", "birthdate": "1998-08-04"},
        {"name": "Luka Misetic", "birthdate": "1998-03-29"},
        {"name": "Maximilian Maier", "birthdate": "2007-12-08"},
        {"name": "Tim Peter", "birthdate": "1998-03-11"},
        {"name": "Stefan Schmitt", "birthdate": "1993-09-17"},
        {"name": "Tim Schreck", "birthdate": "1997-02-03"},
        {"name": "Salomon Böhm", "birthdate": "2007-08-30"},
        {"name": "Johannes Höll", "birthdate": "1993-04-23"},
        {"name": "Jan Keller", "birthdate": "1998-11-14"},
        {"name": "Jacob Kölmel", "birthdate": "2005-10-28"},
        {"name": "Jaron Siefritz", "birthdate": "2008-01-12"},
        {"name": "Daniel Leppert", "birthdate": "1997-07-07"},
    ]
    
    added_count = 0
    skipped_count = 0
    
    for p in default_players:
        # Check if player with this name already exists
        existing_player = db.query(models.Player).filter(models.Player.name == p["name"]).first()
        if existing_player:
            skipped_count += 1
            continue
        
        # Add new player
        db_player = models.Player(
            name=p["name"],
            birthdate=datetime.strptime(p["birthdate"], "%Y-%m-%d").date()
        )
        db.add(db_player)
        added_count += 1
    
    db.commit()
    return {
        "added": added_count,
        "skipped": skipped_count,
        "total_requested": len(default_players)
    } 

@app.post("/backup/")
def create_backup(admin_auth: bool = Depends(get_admin_auth)):
    """Create a timestamped backup of the database and return it as a downloadable file."""
    try:
        # Create backups directory if it doesn't exist
        backup_dir = "backups"
        os.makedirs(backup_dir, exist_ok=True)
        
        # Generate timestamp for unique filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_filename = f"football_backup_{timestamp}.db"
        backup_path = os.path.join(backup_dir, backup_filename)
        
        # Copy the database file
        shutil.copy2("football.db", backup_path)
        
        # Return the file as a downloadable response
        return FileResponse(
            path=backup_path,
            filename=backup_filename,
            media_type="application/octet-stream"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backup failed: {str(e)}")

@app.get("/backups/")
def list_backups(global_auth: bool = Depends(get_global_auth)):
    """List all available backup files."""
    try:
        backup_dir = "backups"
        if not os.path.exists(backup_dir):
            return {"backups": []}
        
        backups = []
        for filename in os.listdir(backup_dir):
            if filename.endswith(".db") and filename.startswith("football_backup_"):
                file_path = os.path.join(backup_dir, filename)
                file_stats = os.stat(file_path)
                backups.append({
                    "filename": filename,
                    "size_bytes": file_stats.st_size,
                    "created": datetime.fromtimestamp(file_stats.st_ctime).isoformat(),
                    "modified": datetime.fromtimestamp(file_stats.st_mtime).isoformat()
                })
        
        # Sort by creation time (newest first)
        backups.sort(key=lambda x: x["created"], reverse=True)
        return {"backups": backups}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list backups: {str(e)}")

# Unknown player management endpoints
@app.get("/unknown-player/goals")
def get_unknown_player_goals(db: Session = Depends(get_db), global_auth: bool = Depends(get_global_auth)):
    """Get all goals assigned to the unknown player."""
    goals = crud.get_unknown_player_goals(db)
    return goals

class GoalReassignmentRequest(BaseModel):
    goal_ids: List[int]
    new_player_id: int

@app.post("/unknown-player/reassign")
def reassign_goals(request: GoalReassignmentRequest, db: Session = Depends(get_db), admin_auth: bool = Depends(get_admin_auth)):
    """Reassign goals from unknown player to a real player."""
    result = crud.reassign_goals(db, request.goal_ids, request.new_player_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Player not found or invalid goal IDs")
    return {"reassigned_goals": result} 