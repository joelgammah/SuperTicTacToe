import pytest  # pyright: ignore[reportMissingImports]

from app.tictactoe.engine import move, new_game, status


def test_new_game_initial_state():
    gs = new_game()
    # boards is a 9x9 nested structure
    assert isinstance(gs.boards, list) and len(gs.boards) == 9
    assert all(isinstance(b, list) and len(b) == 9 for b in gs.boards)
    assert gs.current_player == "X"
    assert gs.winner is None
    assert gs.is_draw is False
    assert status(gs) == "X's turn"


def test_valid_move_and_turn_switch():
    gs = new_game()
    gs = move(gs, 0, 0)
    assert gs.boards[0][0] == "X"
    assert gs.current_player == "O"
    assert gs.winner is None
    assert not gs.is_draw


def test_cannot_play_occupied_cell():
    gs = new_game()
    gs = move(gs, 0, 0)
    with pytest.raises(ValueError):
        move(gs, 0, 0)


def test_winning_rows_cols_diagonals():
    # Row win inside mini-board 0
    gs = new_game()
    gs = move(gs, 0, 0)  # X
    gs = move(gs, 0, 3)  # O
    # tests intentionally bypass forced-board rule by clearing active_board
    gs.active_board = None
    gs = move(gs, 0, 1)  # X
    gs.active_board = None
    gs = move(gs, 0, 4)  # O
    gs.active_board = None
    gs = move(gs, 0, 2)  # X wins mini-board 0
    assert gs.mini_winners[0] == "X"

    # Column win inside mini-board 0
    gs = new_game()
    gs = move(gs, 0, 0)  # X
    gs = move(gs, 0, 1)  # O
    gs.active_board = None
    gs = move(gs, 0, 3)  # X
    gs.active_board = None
    gs = move(gs, 0, 2)  # O
    gs.active_board = None
    gs = move(gs, 0, 6)  # X wins mini-board 0
    assert gs.mini_winners[0] == "X"

    # Diagonal win inside mini-board 0
    gs = new_game()
    gs = move(gs, 0, 0)  # X
    gs = move(gs, 0, 1)  # O
    gs.active_board = None
    gs = move(gs, 0, 4)  # X
    gs.active_board = None
    gs = move(gs, 0, 2)  # O
    gs.active_board = None
    gs = move(gs, 0, 8)  # X wins mini-board 0
    assert gs.mini_winners[0] == "X"


def test_draw_condition_on_mini_board():
    gs = new_game()
    # fill mini-board 0 without producing a mini-winner
    seq = [0, 1, 2, 5, 3, 6, 4, 8, 7]
    for i in seq:
        gs.active_board = None
        gs = move(gs, 0, i)
    # mini-board 0 should be full and not have a mini-winner
    assert all(cell is not None for cell in gs.boards[0])
    assert gs.mini_winners[0] is None
    # global winner remains unset
    assert gs.winner is None


def test_game_over_disallows_moves_when_global_winner_set():
    gs = new_game()
    # simulate a global winner being present
    gs.winner = "X"
    with pytest.raises(ValueError):
        move(gs, 0, 8)
