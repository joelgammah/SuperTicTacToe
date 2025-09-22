from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal

Player = Literal["X", "O"]
Cell = Player | None

WIN_LINES: tuple[tuple[int, int, int], ...] = (
    (0, 1, 2),
    (3, 4, 5),
    (6, 7, 8),  # rows
    (0, 3, 6),
    (1, 4, 7),
    (2, 5, 8),  # cols
    (0, 4, 8),
    (2, 4, 6),  # diagonals
)


@dataclass
class GameState:
    boards: list[list[Cell]] = field(default_factory=lambda: [[None] * 9 for _ in range(9)])
    mini_winners: list[Player | None] = field(default_factory=lambda: [None] * 9)
    active_board: int | None = None  # which sub-board is active; None means any
    current_player: Player = "X"
    winner: Player | None = None
    is_draw: bool = False

    def copy(self) -> GameState:
        return GameState(
            [board.copy() for board in self.boards],
            self.mini_winners.copy(),
            self.active_board,
            self.current_player,
            self.winner,
            self.is_draw,
        )


def _check_winner(board: list[Cell]) -> Player | None:
    for a, b, c in WIN_LINES:
        if board[a] is not None and board[a] == board[b] == board[c]:
            return board[a]
    return None


def _is_full(board: list[Cell]) -> bool:
    return all(cell is not None for cell in board)


def new_game() -> GameState:
    return GameState()


def move(state: GameState, board_index: int, cell_index: int) -> GameState:
    if state.winner or state.is_draw:
        raise ValueError("Game is already over.")
    if not (0 <= board_index < 9):
        raise IndexError("Board index must be in range [0, 8].")
    if not (0 <= cell_index < 9):
        raise IndexError("Cell index must be in range [0, 8].")

    board = state.boards[board_index]
    if board[cell_index] is not None:
        raise ValueError("Cell already occupied.")
    if state.mini_winners[board_index] is not None:
        raise ValueError("This mini-board has already been won.")

    if state.active_board is not None and board_index != state.active_board:
        if state.mini_winners[state.active_board] is None and not _is_full(
            state.boards[state.active_board]
        ):
            raise ValueError(f"You must play in board {state.active_board}.")

    next_state = state.copy()
    next_board = next_state.boards[board_index].copy()
    next_board[cell_index] = state.current_player
    next_state.boards[board_index] = next_board

    # Check for mini-board win
    w = _check_winner(next_board)
    if w is not None:
        next_state.mini_winners[board_index] = w

    # TODO: later add global win/draw check across mini_winners[]
    global_w = _check_winner(next_state.mini_winners)
    if global_w is not None:
        next_state.winner = global_w
    elif all(
        mw is not None or _is_full(b)
        for mw, b in zip(next_state.mini_winners, next_state.boards, strict=False)
    ):
        next_state.is_draw = True

    # For Step 1, 2: just switch turns, no sub-board winner tracking yet
    next_state.current_player = "O" if state.current_player == "X" else "X"

    # 👇 Update forced active board for next turn
    next_state.active_board = cell_index
    if next_state.mini_winners[cell_index] is not None or _is_full(next_state.boards[cell_index]):
        next_state.active_board = None  # any board is allowed

    return next_state


# def available_moves(state: GameState) -> list[int]:
#     return [i for i, cell in enumerate(state.board) if cell is None]


def status(state: GameState) -> str:
    if state.winner:
        return f"{state.winner} wins"
    if state.is_draw:
        return "draw"
    return f"{state.current_player}'s turn"
