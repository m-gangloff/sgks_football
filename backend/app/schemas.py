from typing import Optional, List, TYPE_CHECKING
from pydantic import BaseModel, ConfigDict
from datetime import date

class ShallowMatch(BaseModel):
    id: int
    date: date
    team_young_score: int
    team_old_score: int
    model_config = ConfigDict(from_attributes=True)

class GoalBase(BaseModel):
    player_id: int
    is_own_goal: bool = False
    team: str

class GoalCreate(GoalBase):
    pass

class Goal(GoalBase):
    id: int
    match: Optional[ShallowMatch] = None  # Only shallow info!
    model_config = ConfigDict(from_attributes=True)

class PlayerBase(BaseModel):
    name: str
    birthdate: date

class PlayerCreate(PlayerBase):
    pass

class Player(PlayerBase):
    id: int
    goals: List[Goal] = []
    model_config = ConfigDict(from_attributes=True)

class MatchBase(BaseModel):
    date: date
    team_young_score: int
    team_old_score: int

class MatchCreate(MatchBase):
    goals: List[GoalCreate] = []

class Match(MatchBase):
    id: int
    goals: List[Goal] = []
    model_config = ConfigDict(from_attributes=True)

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    Match = Match  # for type hinting

Goal.model_rebuild()
Match.model_rebuild()