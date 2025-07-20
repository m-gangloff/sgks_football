from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from . import schemas, crud, database
from typing import List
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from . import models
from datetime import datetime

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

# Dependency
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/")
def read_root():
    return {"message": "SGKS Football Stats API"}

@app.post("/players/", response_model=schemas.Player)
def create_player(player: schemas.PlayerCreate, db: Session = Depends(get_db)):
    return crud.create_player(db=db, player=player)

@app.get("/players/", response_model=List[schemas.Player])
def read_players(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_players(db, skip=skip, limit=limit)

@app.put("/players/{player_id}", response_model=schemas.Player)
def update_player(player_id: int, player: schemas.PlayerCreate, db: Session = Depends(get_db)):
    db_player = crud.get_player(db, player_id)
    if not db_player:
        raise HTTPException(status_code=404, detail="Player not found")
    db_player.name = player.name
    db_player.birthdate = player.birthdate
    db.commit()
    db.refresh(db_player)
    return db_player

@app.delete("/players/{player_id}", status_code=204)
def delete_player(player_id: int, db: Session = Depends(get_db)):
    db_player = crud.get_player(db, player_id)
    if not db_player:
        raise HTTPException(status_code=404, detail="Player not found")
    db.delete(db_player)
    db.commit()
    return

@app.delete("/players/", status_code=204)
def delete_all_players(db: Session = Depends(get_db)):
    db.query(models.Goal).delete()
    db.query(models.Player).delete()
    db.commit()
    return

@app.post("/matches/", response_model=schemas.Match)
def create_match(match: schemas.MatchCreate, db: Session = Depends(get_db)):
    return crud.create_match(db=db, match=match)

@app.get("/matches/", response_model=List[schemas.Match])
def read_matches(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_matches(db, skip=skip, limit=limit)

@app.delete("/matches/", status_code=204)
def delete_all_matches(db: Session = Depends(get_db)):
    db.query(models.Goal).delete()
    db.query(models.Match).delete()
    db.commit()
    return

@app.post("/players/defaults", status_code=201)
def add_default_players(db: Session = Depends(get_db)):
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
    for p in default_players:
        db_player = models.Player(
            name=p["name"],
            birthdate=datetime.strptime(p["birthdate"], "%Y-%m-%d").date()
        )
        db.add(db_player)
    db.commit()
    return {"added": len(default_players)} 