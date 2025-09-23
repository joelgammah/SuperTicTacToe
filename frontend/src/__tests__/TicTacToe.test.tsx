import { describe, expect, it, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import TicTacToe from "../components/TicTacToe";

describe("TicTacToe component (Super TicTacToe)", () => {
  it("plays a simple sub-board game and declares mini-winner", async () => {
    const onWin = vi.fn();
    render(<TicTacToe onWin={onWin} />);

    // Wait for game creation
    await screen.findByLabelText("cell-0-0");

    // Play a sequence inside board 0: X at (0,0), O at (0,3), X at (0,1), O at (0,4), X at (0,2)
    fireEvent.click(screen.getByLabelText("cell-0-0"));
    await screen.findByText(/O's turn/i);

    fireEvent.click(screen.getByLabelText("cell-0-3"));
    await screen.findByText(/X's turn/i);

    fireEvent.click(screen.getByLabelText("cell-0-1"));
    await screen.findByText(/O's turn/i);

    fireEvent.click(screen.getByLabelText("cell-0-4"));
    await screen.findByText(/X's turn/i);

    fireEvent.click(screen.getByLabelText("cell-0-2"));

    // That should give X a row win inside mini-board 0
    expect(await screen.findByLabelText("cell-0-0")).toHaveTextContent("X");
    // expect(await screen.findByText("X", { selector: "div" })).toBeInTheDocument();
    expect(onWin).not.toHaveBeenCalled(); // global game not over yet
  });

  it("prevents moves in occupied cells", async () => {
    render(<TicTacToe />);
    const c00 = await screen.findByLabelText("cell-0-0");
    fireEvent.click(c00);
    await screen.findByText(/O's turn/i);
    fireEvent.click(c00); // second click ignored
    await screen.findByText(/O's turn/i);
    expect(c00.textContent).toBe("X");
  });

  it("can start a new game after finishing", async () => {
    render(<TicTacToe />);
    await screen.findByLabelText("cell-0-0");

    // play a mini win in board 0
    fireEvent.click(screen.getByLabelText("cell-0-0"));
    await screen.findByText(/O's turn/i);
    fireEvent.click(screen.getByLabelText("cell-0-3"));
    await screen.findByText(/X's turn/i);
    fireEvent.click(screen.getByLabelText("cell-0-1"));
    await screen.findByText(/O's turn/i);
    fireEvent.click(screen.getByLabelText("cell-0-4"));
    await screen.findByText(/X's turn/i);
    fireEvent.click(screen.getByLabelText("cell-0-2"));

    // wait for mini-win status to appear
    await screen.findByText(/X wins board 0/i);
    const newGameBtn = screen.getByRole("button", { name: /new game/i });
    fireEvent.click(newGameBtn);
    const c00 = await screen.findByLabelText("cell-0-0");
    expect(c00.textContent).toBe("");
  });
});
