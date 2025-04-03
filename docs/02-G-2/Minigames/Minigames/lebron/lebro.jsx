import React, { useState, useEffect } from "react";
import styles from "./styles.module.css";

export default function MiniLeBronDunk() {
  const [position, setPosition] = useState(0);
  const [speed, setSpeed] = useState(20);
  const [movingRight, setMovingRight] = useState(true);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    if (gameOver) return;
    const interval = setInterval(() => {
      setPosition((prev) => {
        if (prev >= 100) setMovingRight(false);
        if (prev <= 0) setMovingRight(true);
        return movingRight ? prev + 5 : prev - 5;
      });
    }, speed);
    return () => clearInterval(interval);
  }, [movingRight, speed, gameOver]);

  const handleStop = () => {
    if (position > 40 && position < 60) {
      setScore(score + 1);
      setSpeed(Math.max(speed - 2, 5)); // Wird immer schneller
    } else {
      setGameOver(true);
    }
  };

  const restartGame = () => {
    setScore(0);
    setSpeed(20);
    setGameOver(false);
    setPosition(0);
  };

  return (
    <div className={styles.container}>
      <h1>🏀 Mini LeBron Dunk</h1>
      <h2>Score: {score}</h2>
      <div className={styles.bar}>
        <div className={styles.greenZone}></div>
        <div
          className={styles.marker}
          style={{ left: `${position}%` }}
        ></div>
      </div>
      {!gameOver ? (
        <button className={styles.button} onClick={handleStop}>DUNK!</button>
      ) : (
        <div>
          <h2 className={styles.boo}>BOOOOH! 😭 Mini LeBron ist enttäuscht...</h2>
          <button className={styles.button} onClick={restartGame}>Try Again</button>
        </div>
      )}
    </div>
  );
}
