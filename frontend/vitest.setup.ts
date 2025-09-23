import "@testing-library/jest-dom";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

// Create a fresh 9x9 empty board
function emptyBoards() {
  return Array.from({ length: 9 }, () => Array(9).fill(null));
}

// Initial game state
const initial = {
  id: "TEST-1",
  boards: emptyBoards(),
  mini_winners: Array(9).fill(null),
  active_board: null,
  current_player: "X",
  winner: null,
  is_draw: false,
  status: "X's turn",
};

// Script for a mini-board win (just board 0 for testing)
const script = [
  {
    ...initial,
    boards: (() => {
      const b = emptyBoards();
      b[0][0] = "X";
      return b;
    })(),
    active_board: 0,
    current_player: "O",
    status: "O's turn",
  },
  {
    ...initial,
    boards: (() => {
      const b = emptyBoards();
      b[0][0] = "X";
      b[0][3] = "O";
      return b;
    })(),
    active_board: 0,
    current_player: "X",
    status: "X's turn",
  },
  {
    ...initial,
    boards: (() => {
      const b = emptyBoards();
      b[0][0] = "X";
      b[0][1] = "X";
      b[0][3] = "O";
      return b;
    })(),
    active_board: 0,
    current_player: "O",
    status: "O's turn",
  },
  {
    ...initial,
    boards: (() => {
      const b = emptyBoards();
      b[0][0] = "X";
      b[0][1] = "X";
      b[0][3] = "O";
      b[0][4] = "O";
      return b;
    })(),
    active_board: 0,
    current_player: "X",
    status: "X's turn",
  },
  {
    ...initial,
    boards: (() => {
      const b = emptyBoards();
      b[0][0] = "X";
      b[0][1] = "X";
      b[0][2] = "X";
      b[0][3] = "O";
      b[0][4] = "O";
      return b;
    })(),
    mini_winners: (() => {
      const w = Array(9).fill(null);
      w[0] = "X"; // X wins board 0
      return w;
    })(),
    active_board: null,
    current_player: "X",
    status: "X wins board 0",
  },
];

let step = -1;

export const server = setupServer(
  // Create game
  http.post("http://localhost:8000/tictactoe/new", async () => {
    step = -1;
    return HttpResponse.json(initial);
  }),

  // Make move
  http.post("http://localhost:8000/tictactoe/:id/move", async () => {
    step += 1;
    return HttpResponse.json({
      id: "TEST-1",
      ...script[step],
    });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
