// Board.jsx
import React, { useState, useEffect } from 'react';
import styles from './styles.module.css';

const Board = ({ initialQueens = [] }) => {
    const [board, setBoard] = useState(
        Array(8)
            .fill()
            .map(() => Array(8).fill(null))
    );

    useEffect(() => {
        // Initialize board with initial queens
        const newBoard = Array(8)
            .fill()
            .map(() => Array(8).fill(null));
        initialQueens.forEach((pos) => {
            if (pos.row >= 0 && pos.row < 8 && pos.col >= 0 && pos.col < 8) {
                newBoard[pos.row][pos.col] = { isInitial: true };
            }
        });
        setBoard(newBoard);
    }, [initialQueens]);

    const isUnderAttack = (row, col) => {
        // Check if a position is under attack from any queen on the board
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (board[i][j] && (i !== row || j !== col)) {
                    // Check if same row, column, or diagonal
                    if (i === row || j === col || Math.abs(i - row) === Math.abs(j - col)) {
                        return true;
                    }
                }
            }
        }
        return false;
    };

    const handleCellClick = (row, col) => {
        const newBoard = [...board.map((row) => [...row])];

        if (newBoard[row][col]) {
            // If cell has a queen and it's not an initial queen, remove it
            if (!newBoard[row][col].isInitial) {
                newBoard[row][col] = null;
            }
        } else {
            // Place a new queen
            newBoard[row][col] = { isInitial: false };
        }

        setBoard(newBoard);
    };

    return (
        <div className={styles.board}>
            {board.map((row, rowIndex) => (
                <div key={rowIndex} className={styles.row}>
                    {row.map((cell, colIndex) => {
                        const isBlack = (rowIndex + colIndex) % 2 === 1;
                        const hasQueen = cell !== null;
                        const isInitialQueen = hasQueen && cell.isInitial;
                        const isAttacked = hasQueen && !isInitialQueen && isUnderAttack(rowIndex, colIndex);

                        return (
                            <div
                                key={colIndex}
                                className={`${styles.cell} ${isBlack ? styles.black : styles.white}`}
                                onClick={() => handleCellClick(rowIndex, colIndex)}
                            >
                                {hasQueen && (
                                    <div
                                        className={`${styles.queen} ${
                                            isInitialQueen
                                                ? styles.initialQueen
                                                : isAttacked
                                                  ? styles.attackedQueen
                                                  : styles.safeQueen
                                        }`}
                                    >
                                        ♕
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
};

export default Board;
