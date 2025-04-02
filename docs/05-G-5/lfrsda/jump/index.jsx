// Game.jsx
import React, { useState } from "react";
import styles from "./style.module.css";

const Game = () => {
  const [score, setScore] = useState(0);
  const [position, setPosition] = useState({ top: "50%", left: "50%" });

  const moveTarget = () => {
    const newTop = Math.random() * 80 + "%";
    const newLeft = Math.random() * 80 + "%";
    setPosition({ top: newTop, left: newLeft });
  };

  const handleClick = () => {
    setScore(score + 1);
    moveTarget();
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.score}>Score: {score}</h1>
      <div
        className={styles.target}
        style={{ top: position.top, left: position.left, position: "absolute" }}
        onClick={handleClick}
      ></div>
    </div>
  );
};

export default Game;


