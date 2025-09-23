from fastapi import FastAPI  # pyright: ignore[reportMissingImports]
from fastapi.testclient import TestClient  # pyright: ignore[reportMissingImports]

from app.tictactoe.router import router

app = FastAPI()
app.include_router(router)
client = TestClient(app)


def test_create_and_get_game():
    r = client.post("/tictactoe/new", json={"starting_player": "O"})
    assert r.status_code == 200
    data = r.json()
    gid = data["id"]
    assert data["current_player"] == "O"

    r = client.get(f"/tictactoe/{gid}")
    assert r.status_code == 200
    data2 = r.json()
    assert data2["id"] == gid
    # boards should be a 9x9 nested list of None
    assert isinstance(data2["boards"], list) and len(data2["boards"]) == 9
    assert all(b == [None] * 9 for b in data2["boards"])


def test_make_move_and_win_flow():
    r = client.post("/tictactoe/new", json={"starting_player": "X"})
    gid = r.json()["id"]

    # X at 0
    r = client.post(f"/tictactoe/{gid}/move", json={"board_index": 0, "cell_index": 0})
    assert r.status_code == 200
    # O at 3
    r = client.post(f"/tictactoe/{gid}/move", json={"board_index": 0, "cell_index": 3})
    assert r.status_code == 200
    # X at 1 - this is illegal because active_board is 3 after previous move
    r = client.post(f"/tictactoe/{gid}/move", json={"board_index": 0, "cell_index": 1})
    # engine enforces forced-board rule so this should be rejected
    assert r.status_code == 400
    assert "You must play in board" in r.json()["detail"]

    # Make the correct move in the forced board (board 3)
    r = client.post(f"/tictactoe/{gid}/move", json={"board_index": 3, "cell_index": 0})
    assert r.status_code == 200
    # O at 4
    r = client.post(f"/tictactoe/{gid}/move", json={"board_index": 0, "cell_index": 4})
    assert r.status_code == 200
    # Next, X must play in the forced board (board 4). Play at (4,0).
    r = client.post(f"/tictactoe/{gid}/move", json={"board_index": 4, "cell_index": 0})
    assert r.status_code == 200
    data = r.json()
    # verify the previous moves are reflected and the new move was applied
    assert data["boards"][0][0] == "X"
    assert data["boards"][0][3] == "O"
    assert data["boards"][3][0] == "X"
    assert data["boards"][0][4] == "O"
    assert data["boards"][4][0] == "X"


def test_bad_requests():
    r = client.post("/tictactoe/new", json={})
    gid = r.json()["id"]

    # invalid board index
    r = client.post(f"/tictactoe/{gid}/move", json={"board_index": 99, "cell_index": 0})
    assert r.status_code == 400
    assert "Board index must be in range" in r.json()["detail"]

    # occupy cell (board 0, cell 0) then try again
    client.post(f"/tictactoe/{gid}/move", json={"board_index": 0, "cell_index": 0})
    r = client.post(f"/tictactoe/{gid}/move", json={"board_index": 0, "cell_index": 0})
    assert r.status_code == 400
    assert "Cell already occupied" in r.json()["detail"]
