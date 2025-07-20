from sqlalchemy import Column, Integer, String, Date, Boolean, ForeignKey
from sqlalchemy.orm import relationship, declarative_base

Base = declarative_base()

class Player(Base):
    __tablename__ = "players"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    birthdate = Column(Date)
    goals = relationship("Goal", back_populates="player")

class Match(Base):
    __tablename__ = "matches"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date)
    team_young_score = Column(Integer)
    team_old_score = Column(Integer)
    goals = relationship("Goal", back_populates="match")

class Goal(Base):
    __tablename__ = "goals"
    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id"))
    player_id = Column(Integer, ForeignKey("players.id"))
    is_own_goal = Column(Boolean, default=False)
    team = Column(String)  # 'young' or 'old'
    match = relationship("Match", back_populates="goals")
    player = relationship("Player", back_populates="goals") 