// TicTacToe.tsx
import React, { useState } from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import _ from 'lodash';
import Loader from '@tdev-components/Loader';

type SquareValue = 'X' | 'O' | null;

interface SquareProps {
  value: SquareValue;
  onClick: () => void;
}

interface TicTacToeProps {
  onGameEnd?: (winner: SquareValue) => void;
}

const Square: React.FC<SquareProps> = ({ value, onClick }) => {
  return (
    <button 
      className={clsx(
        styles.tttSquare,
        value === 'X' && styles.tttSquareX,
        value === 'O' && styles.tttSquareO
      )} 
      onClick={onClick}
    >
      {value}
    </button>
  );
};

const RoboPlayer = (squares: SquareValue[]) => {
    const availableIdx = squares.map((v, idx) => v ? null : idx).filter(s => s !== null);
    const nextIdx = _.sample(availableIdx);
    console.log(squares, availableIdx, nextIdx)
    return nextIdx;
}

const TicTacToe: React.FC<TicTacToeProps> = ({ onGameEnd }) => {
  const [roboToken, setRoboToken] = useState<'X' | 'O'>(Math.random() > 0.5 ? 'X' : 'O')
  const [squares, setSquares] = useState<SquareValue[]>(Array(9).fill(null));
  const [nextPlayer, setNextPlayer] = useState<'X' | 'O'>('X');
  const playerToken = roboToken === 'X' ? 'O' : 'X';
  
  const setTokenTo = (i: number, token: 'X' | 'O') => {
    if (calculateWinner(squares) || squares[i] || nextPlayer !== token) {
      return;
    }
    
    const newSquares = squares.slice();
    newSquares[i] = token;
    setSquares(newSquares);
    setNextPlayer(token === 'X' ? 'O' : 'X');
    
    // Check if game ended after this move
    const winner = calculateWinner(newSquares);
    const isDraw = newSquares.every(square => square !== null);
    
    if (winner || isDraw) {
      onGameEnd?.(winner);
    }
  };
  React.useEffect(() => {
    if (nextPlayer === roboToken) {
        const next = RoboPlayer(squares);
        if (next !== undefined) {
            setTimeout(() => {
                setTokenTo(next, roboToken)
            }, 400)
        }
    }
  }, [nextPlayer, squares, roboToken]);


  const winner = calculateWinner(squares);
  const status = winner 
    ? `Gewinner: ${winner}` 
    : squares.every(square => square !== null)
      ? 'Das Spiel ended unentschieden!'
      : `Nächster Zug: ${nextPlayer ? 'X' : 'O'}`;

  const resetGame = () => {
    setRoboToken(Math.random() > 0.5 ? 'X' : 'O')
    setSquares(Array(9).fill(null));
    setNextPlayer('X');
  };

  return (
    <div className={clsx(styles.tttContainer)}>
      <div className={clsx(styles.tttStatus)}>
        {status}
      </div>
      <div className={clsx(styles.tttBoard)}>
        <div className={clsx(styles.tttRow)}>
          <Square value={squares[0]} onClick={() => setTokenTo(0, playerToken)} />
          <Square value={squares[1]} onClick={() => setTokenTo(1, playerToken)} />
          <Square value={squares[2]} onClick={() => setTokenTo(2, playerToken)} />
        </div>
        <div className={clsx(styles.tttRow)}>
          <Square value={squares[3]} onClick={() => setTokenTo(3, playerToken)} />
          <Square value={squares[4]} onClick={() => setTokenTo(4, playerToken)} />
          <Square value={squares[5]} onClick={() => setTokenTo(5, playerToken)} />
        </div>
        <div className={clsx(styles.tttRow)}>
          <Square value={squares[6]} onClick={() => setTokenTo(6, playerToken)} />
          <Square value={squares[7]} onClick={() => setTokenTo(7, playerToken)} />
          <Square value={squares[8]} onClick={() => setTokenTo(8, playerToken)} />
        </div>
        {nextPlayer === roboToken && !winner && <Loader noLabel overlay />}
      </div>
      <button 
        className={clsx(styles.tttResetButton)} 
        onClick={resetGame}
      >
        Spiel Zurücksetzen
      </button>
    </div>
  );
};

function calculateWinner(squares: SquareValue[]): SquareValue {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  
  return null;
}

export default TicTacToe;