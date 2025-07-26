from sqlalchemy import Column, Integer, String, Date, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship, declarative_base

Base = declarative_base()

class Player(Base):
    __tablename__ = "players"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, unique=True)
    birthdate = Column(Date)
    goals = relationship("Goal", back_populates="player")
    
    __table_args__ = (
        UniqueConstraint('name', name='uq_player_name'),
    )
    
    @classmethod
    def get_unknown_player(cls, db):
        """Get or create the unknown player for orphaned goals."""
        unknown_player = db.query(cls).filter(cls.name == "Unknown Player (Deleted)").first()
        if not unknown_player:
            # Use a default birthdate for the unknown player
            from datetime import date
            unknown_player = cls(
                name="Unknown Player (Deleted)",
                birthdate=date(1, 1, 1)  # Default birthdate: 01.01.0001
            )
            db.add(unknown_player)
            db.commit()
            db.refresh(unknown_player)
        return unknown_player

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
    player_id = Column(Integer, ForeignKey("players.id"), nullable=True)
    is_own_goal = Column(Boolean, default=False)
    team = Column(String)  # 'young' or 'old'
    match = relationship("Match", back_populates="goals")
    player = relationship("Player", back_populates="goals") 