import React, { useState } from "react";
import styles from "./styles.module.css";

const generateBoard = () => {
  let tiles = Array(24).fill("💎"); // 24 Gems
  tiles.splice(Math.floor(Math.random() * tiles.length), 0, "💣"); // 1 Random Bombe
  return tiles.map((symbol, index) => ({ id: index, symbol, flipped: false }));
};

export default function Game() {
  const [board, setBoard] = useState(generateBoard);
  const [money, setMoney] = useState(1);
  const [gameOver, setGameOver] = useState(false);

  const handleClick = (id) => {
    if (gameOver || board[id].flipped) return;

    let newBoard = [...board];
    newBoard[id].flipped = true;
    setBoard(newBoard);

    if (newBoard[id].symbol === "💣") {
      setGameOver(true);
      setMoney(0);
    } else {
      setMoney(money * 2); // Jedes Mal Geld verdoppeln
    }
  };

  return (
    <div className={styles.container}>
      <h1>💰 Geld: ${money}</h1>
      <div className={styles.grid}>
        {board.map((tile) => (
          <div
            key={tile.id}
            className={`${styles.tile} ${tile.flipped ? styles.flipped : ""}`}
            onClick={() => handleClick(tile.id)}
          >
            {tile.flipped ? tile.symbol : "❓"}
          </div>
        ))}
      </div>
      {gameOver && <h2 className={styles.gameOver}>💥 BOOM! Alles verloren!</h2>}
    </div>
  );
}