import React, { useState, useEffect } from 'react';
import styles from './styles.module.css';

const Board = ({ initialQueens = [] }) => {
    const [board, setBoard] = useState(
        Array(8).fill().map(() => Array(8).fill(null))
    );
    const [result, setResult] = useState(null);

    useEffect(() => {
        const newBoard = Array(8).fill().map(() => Array(8).fill(null));
        initialQueens.forEach((pos) => {
            if (pos.row >= 0 && pos.row < 8 && pos.col >= 0 && pos.col < 8) {
                newBoard[pos.row][pos.col] = { isInitial: true };
            }
        });
        setBoard(newBoard);
    }, [initialQueens]);

    const isUnderAttack = (row, col) => {
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (board[i][j] && (i !== row || j !== col)) {
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
            if (!newBoard[row][col].isInitial) {
                newBoard[row][col] = null;
            }
        } else {
            newBoard[row][col] = { isInitial: false };
        }
        setBoard(newBoard);
    };

    const checkSolution = () => {
        let queens = [];
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (board[i][j]) {
                    queens.push({ row: i, col: j });
                }
            }
        }

        const isValid = queens.length === 8 && queens.every(q => !isUnderAttack(q.row, q.col));
        setResult(isValid ? 4 : [1, 2, 3, 5][Math.floor(Math.random() * 4)]);
    };

    return (
        <div>
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
                                                isInitialQueen ? styles.initialQueen : isAttacked ? styles.attackedQueen : styles.safeQueen
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
            <button onClick={checkSolution} className={styles.checkButton} style={{ fontSize: '20px', padding: '10px 20px' }}>Check Solution</button>
            {result !== null && <p>Resultat: {result}</p>}
        </div>
    );
};

export default Board;
