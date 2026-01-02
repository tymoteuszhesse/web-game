"""
Highscores Schemas
Data models for leaderboard responses
"""
from pydantic import BaseModel
from typing import List


class HighscoreEntry(BaseModel):
    """Single entry in a leaderboard"""
    rank: int
    player_id: int
    username: str
    level: int
    exp: int
    item_score: int
    gold: int
    base_attack: int
    base_defense: int
    base_hp: int

    class Config:
        from_attributes = True


class HighscoresResponse(BaseModel):
    """Response containing both leaderboards"""
    by_level: List[HighscoreEntry]
    by_item_score: List[HighscoreEntry]
