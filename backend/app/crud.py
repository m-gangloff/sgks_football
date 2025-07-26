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
    # Check if player with this name already exists
    existing_player = db.query(models.Player).filter(models.Player.name == player.name).first()
    if existing_player:
        return None  # Return None to indicate duplicate name
    
    db_player = models.Player(name=player.name, birthdate=player.birthdate)
    db.add(db_player)
    db.commit()
    db.refresh(db_player)
    return db_player

def delete_player(db: Session, player_id: int):
    """Delete a player and reassign their goals to the unknown player."""
    player = db.query(models.Player).filter(models.Player.id == player_id).first()
    if not player:
        return None
    
    # Don't delete the unknown player
    if player.name == "Unknown Player (Deleted)":
        return None
    
    # Get or create unknown player BEFORE deleting the original player
    unknown_player = models.Player.get_unknown_player(db)
    
    # Reassign all goals from this player to unknown player
    goals_to_reassign = db.query(models.Goal).filter(models.Goal.player_id == player_id).all()
    
    # Update goals in a separate transaction to ensure they're saved
    for goal in goals_to_reassign:
        goal.player_id = unknown_player.id
    
    # Commit the goal reassignments first
    db.commit()
    
    # Now delete the player
    db.delete(player)
    db.commit()
    
    return {
        "deleted_player": player.name,
        "reassigned_goals": len(goals_to_reassign)
    }

def get_match(db: Session, match_id: int):
    return db.query(models.Match).options(
        joinedload(models.Match.goals).joinedload(models.Goal.player)
    ).filter(models.Match.id == match_id).first()

def get_matches(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Match).options(
        joinedload(models.Match.goals).joinedload(models.Goal.player)
    ).offset(skip).limit(limit).all()

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

def delete_match(db: Session, match_id: int):
    """Delete a match and all its associated goals."""
    match = db.query(models.Match).filter(models.Match.id == match_id).first()
    if not match:
        return None
    
    # Delete all goals associated with this match
    goals_deleted = db.query(models.Goal).filter(models.Goal.match_id == match_id).delete()
    
    # Delete the match
    db.delete(match)
    db.commit()
    
    return {
        "deleted_match": f"{match.date} - {match.team_old_score}:{match.team_young_score}",
        "deleted_goals": goals_deleted
    }

def get_unknown_player_goals(db: Session):
    """Get all goals assigned to the unknown player."""
    unknown_player = models.Player.get_unknown_player(db)
    return db.query(models.Goal).options(
        joinedload(models.Goal.match)
    ).filter(models.Goal.player_id == unknown_player.id).all()

def reassign_goals(db: Session, goal_ids: List[int], new_player_id: int):
    """Reassign specific goals from unknown player to a real player."""
    # Verify the new player exists
    new_player = db.query(models.Player).filter(models.Player.id == new_player_id).first()
    if not new_player:
        return None
    
    # Get unknown player
    unknown_player = models.Player.get_unknown_player(db)
    
    # Reassign the goals
    goals = db.query(models.Goal).filter(
        models.Goal.id.in_(goal_ids),
        models.Goal.player_id == unknown_player.id
    ).all()
    
    for goal in goals:
        goal.player_id = new_player_id
    
    db.commit()
    return len(goals) 