// JumpGame.jsx
import React, { useState, useEffect } from "react";
import styles from "./styles.module.css";

const JumpGame = () => {
  const [position, setPosition] = useState(50);
  const [velocity, setVelocity] = useState(0);
  const [obstacles, setObstacles] = useState([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    const handleJump = () => {
      if (!gameOver) setVelocity(-8);
    };
    window.addEventListener(
      "keydown",
      (e) => e.code === "Space" && handleJump()
    );
    window.addEventListener("touchstart", handleJump);
    return () => {
      window.removeEventListener(
        "keydown",
        (e) => e.code === "Space" && handleJump()
      );
      window.removeEventListener("touchstart", handleJump);
    };
  }, [gameOver]);

  useEffect(() => {
    if (gameOver) return;

    const gameLoop = setInterval(() => {
      setPosition((pos) => Math.min(pos + velocity, 90));
      setVelocity((v) => v + 1);

      setObstacles((prev) => {
        const newObstacles = prev.map((obstacle) => ({
          ...obstacle,
          left: obstacle.left - 5,
        }));
        if (Math.random() < 0.05) {
          newObstacles.push({ left: 100, height: Math.random() * 40 + 30 });
        }
        newObstacles.forEach((obstacle) => {
          if (obstacle.left < 10 && position > 100 - obstacle.height) {
            setGameOver(true);
          }
        });
        return newObstacles.filter((obstacle) => obstacle.left > -10);
      });
      setScore((s) => s + 1);
    }, 100);

    return () => clearInterval(gameLoop);
  }, [position, velocity, gameOver]);

  const resetGame = () => {
    setPosition(50);
    setVelocity(0);
    setObstacles([]);
    setScore(0);
    setGameOver(false);
  };

  return (
    <div className={styles.container}>
      {gameOver ? (
        <div className={styles.gameOverScreen}>
          <h1>Game Over! Score: {score}</h1>
          <button className={styles.resetButton} onClick={resetGame}>
            Restart
          </button>
        </div>
      ) : (
        <h1 className={styles.score}>Score: {score}</h1>
      )}
      <div className={styles.player} style={{ bottom: `${position}%` }}></div>
      {obstacles.map((obstacle, index) => (
        <div
          key={index}
          className={styles.obstacle}
          style={{ left: `${obstacle.left}%`, height: `${obstacle.height}%` }}
        ></div>
      ))}
    </div>
  );
};

export default JumpGame;

