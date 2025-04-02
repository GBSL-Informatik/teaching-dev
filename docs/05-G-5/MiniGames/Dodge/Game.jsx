import React, { useState, useEffect } from "react";
import styles from "./styles.module.css";

const Game = () => {
  const [playerPos, setPlayerPos] = useState(135);
  const [blocks, setBlocks] = useState([]);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    if (gameOver) return;
    
    const interval = setInterval(() => {
      setBlocks((prevBlocks) => {
        const newBlocks = prevBlocks
          .map((block) => ({ ...block, y: block.y + 5 }))
          .filter((block) => block.y < 400);

        if (Math.random() < 0.1) {
          newBlocks.push({ x: Math.random() * 270, y: 0 });
        }

        newBlocks.forEach((block) => {
          if (block.y > 360 && block.x > playerPos - 30 && block.x < playerPos + 30) {
            setGameOver(true);
          }
        });

        return newBlocks;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [gameOver, playerPos]);

  const moveLeft = () => {
    if (playerPos > 0) setPlayerPos((pos) => pos - 20);
  };

  const moveRight = () => {
    if (playerPos < 270) setPlayerPos((pos) => pos + 20);
  };

  React.useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        setPlayerPos((pos) => Math.min(pos + 20, 270))
      } else if (e.key === 'ArrowLeft') {
        setPlayerPos((pos) => Math.max(pos - 20, 0))
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    }
    
  }, [])


  const restartGame = () => {
    setPlayerPos(135);
    setBlocks([]);
    setGameOver(false);
  };

  return (
    <div className={styles.container}>
      <h1>Dodge the Blocks! 🏃‍♂️</h1>
      <div className={styles.gameArea}>
        <div className={styles.player} style={{ left: playerPos }}></div>
        {blocks.map((block, index) => (
          <div key={index} className={styles.block} style={{ left: block.x, top: block.y }}></div>
        ))}
      </div>
      <div>
        <button onClick={moveLeft}>⬅️</button>
        <button onClick={moveRight}>➡️</button>
      </div>
      {gameOver && <button onClick={restartGame}>Restart</button>}
    </div>
  );
};

export default Game;

