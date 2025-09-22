import React from "react";

type Player = "X" | "O";
type Cell = Player | null;

type Props = {
  onWin?: (winner: Player | "draw" | null) => void;
};

// ----- Backend DTOs -----
type GameStateDTO = {
  id: string;
  boards: Cell[][];
  mini_winners: (Player | null)[];
  active_board: number | null;
  current_player: Player;
  winner: Player | null;
  is_draw: boolean;
  status: string;
};

// Prefer env, fallback to localhost:8000
const API_BASE =
  (import.meta as any)?.env?.VITE_API_URL?.replace(/\/$/, "") ??
  "http://localhost:8000";



export default function TicTacToe({ onWin }: Props) {
  const [state, setState] = React.useState<GameStateDTO | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Create a new game on mount
  React.useEffect(() => {
    let canceled = false;
    async function start() {
      setError(null);
      setLoading(true);
      try {
        const gs = await createGame();
        if (!canceled) setState(gs);
      } catch (e: any) {
        if (!canceled) setError(e?.message ?? "Failed to start game");
      } finally {
        if (!canceled) setLoading(false);
      }
    }
    start();
    return () => {
      canceled = true;
    };
  }, []);

  // Notify parent when result changes
  React.useEffect(() => {
    if (!state || !onWin) return;
    if (state.winner) onWin(state.winner);
    else if (state.is_draw) onWin("draw");
  }, [state?.winner, state?.is_draw]);

  async function createGame(): Promise<GameStateDTO> {
    const r = await fetch(`${API_BASE}/tictactoe/new`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ starting_player: "X" }),
    });
    if (!r.ok) throw new Error(`Create failed: ${r.status}`);
    return r.json();
  }

  async function playMove(boardIndex: number, cellIndex: number): Promise<GameStateDTO> {
    if (!state) throw new Error("No game");
    const r = await fetch(`${API_BASE}/tictactoe/${state.id}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ board_index: boardIndex, cell_index: cellIndex }),
    });
    if (!r.ok) {
      const detail = await r.json().catch(() => ({}));
      throw new Error(detail?.detail ?? `Move failed: ${r.status}`);
    }
    return r.json();
  }

  async function handleClick(boardIndex: number, cellIndex: number) {
    if (!state || loading) return;

    const board = state.boards[boardIndex];
    if (state.winner || state.is_draw || board[cellIndex] !== null) return;

    setLoading(true);
    setError(null);
    try {
      const next = await playMove(boardIndex, cellIndex);
      setState(next);
    } catch (e: any) {
      setError(e?.message ?? "Move failed");
    } finally {
      setLoading(false);
    }
  }

  async function reset() {
    setLoading(true);
    setError(null);
    try {
      const gs = await createGame();
      setState(gs);
    } catch (e: any) {
      setError(e?.message ?? "Failed to reset");
    } finally {
      setLoading(false);
    }
  }

  if (error) {
    return (
      <div className="max-w-sm mx-auto p-4">
        <div className="mb-2 text-red-600 font-semibold">Error: {error}</div>
        <button className="rounded-2xl px-4 py-2 border" onClick={reset}>
          Retry
        </button>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="max-w-sm mx-auto p-4">
        <div className="text-center">Loading…</div>
      </div>
    );
  }

  const { boards, status } = state;

  return (
    <div className="max-w-sm mx-auto p-4">
      <div className="text-center mb-2 text-xl font-semibold">{status}</div>
      {/* New helper message */}
      {state.active_board !== null && (
        <div className="text-center mb-4 text-blue-600 font-medium">
          You must play in board {state.active_board + 1}
        </div>
      )}
      <div className="grid grid-cols-3 gap-4">
        {state.boards.map((board, boardIndex) => {
          const miniWinner = state.mini_winners[boardIndex];
          const isActive = state.active_board === null || state.active_board === boardIndex;
          return (
            <div
              key={boardIndex}
              className={`relative grid grid-cols-3 gap-1 border p-1 rounded-lg ${
                isActive ? "ring-4 ring-blue-400" : "opacity-50"
              }`}
            >
              {board.map((c, cellIndex) => (
                <button
                  key={cellIndex}
                  className="aspect-square rounded-2xl border text-xl font-bold flex items-center justify-center disabled:opacity-50"
                  onClick={() => handleClick(boardIndex, cellIndex)}
                  disabled={
                    loading ||
                    c !== null ||
                    state.winner !== null ||
                    state.is_draw ||
                    miniWinner !== null ||
                    !isActive // prevent clicks outside active board
                  }
                >
                  {c}
                </button>
              ))}
              {miniWinner && (
                <div className="absolute inset-0 bg-gray-200/80 flex items-center justify-center text-5xl font-bold">
                  {miniWinner}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="text-center mt-3">
        <button className="rounded-2xl px-4 py-2 border" onClick={reset} disabled={loading}>
          New Game
        </button>
      </div>
    </div>
  );
}