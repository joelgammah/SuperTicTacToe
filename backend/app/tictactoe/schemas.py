from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field  # pyright: ignore[reportMissingImports]

Player = Literal["X", "O"]


class GameCreate(BaseModel):
    starting_player: Player | None = Field(default="X")


class GameStateDTO(BaseModel):
    id: str
    boards: list[list[Player | None]]  # 9 sub-boards, each 9 cells
    mini_winners: list[Player | None]
    active_board: int | None
    current_player: Player
    winner: Player | None
    is_draw: bool
    status: str


# BoardIndex = conint(ge=0, le=8)
# CellIndex = conint(ge=0, le=8)


class MoveRequest(BaseModel):
    board_index: int
    cell_index: int
