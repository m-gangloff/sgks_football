from sqlalchemy.orm import Session, joinedload
from . import models, schemas
from typing import List

def get_player(db: Session, player_id: int):
    return db.query(models.Player).filter(models.Player.id == player_id).first()

def get_players(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Player).options(
        joinedload(models.Player.goals).joinedload(models.Goal.match)
    ).offset(skip).limit(limit).all()

def create_player(db: Session, player: schemas.PlayerCreate):
    db_player = models.Player(name=player.name, birthdate=player.birthdate)
    db.add(db_player)
    db.commit()
    db.refresh(db_player)
    return db_player

def get_match(db: Session, match_id: int):
    return db.query(models.Match).filter(models.Match.id == match_id).first()

def get_matches(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Match).offset(skip).limit(limit).all()

def create_match(db: Session, match: schemas.MatchCreate):
    db_match = models.Match(date=match.date, team_young_score=match.team_young_score, team_old_score=match.team_old_score)
    db.add(db_match)
    db.commit()
    db.refresh(db_match)
    for goal in match.goals:
        db_goal = models.Goal(match_id=db_match.id, player_id=goal.player_id, is_own_goal=goal.is_own_goal, team=goal.team)
        db.add(db_goal)
    db.commit()
    db.refresh(db_match)
    return db_match 