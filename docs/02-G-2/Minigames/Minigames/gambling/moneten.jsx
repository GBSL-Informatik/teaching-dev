import React, { useState } from "react";
import styles from "./styles.module.css";

const symbols = ["💎", "🔮", "💰", "✨", "🎲", "🔥", "👑", "⚡", "🌟", "🍀", "💣"];
const gemMultipliers = { "💎": 2, "🔮": 3, "💰": 5, "✨": 4, "🎲": 1.5, "🔥": 2.5, "👑": 3, "⚡": 1.2, "🌟": 1.8, "🍀": 2 };

const SlotGame = () => {
  const [grid, setGrid] = useState(Array(5).fill().map(() => Array(5).fill("💎")));
  const [money, setMoney] = useState(10);
  const [spinning, setSpinning] = useState(false);

  const spin = () => {
    if (spinning) return;
    setSpinning(true);
    
    let newGrid = Array(5)
      .fill()
      .map(() => Array(5).fill().map(() => symbols[Math.floor(Math.random() * symbols.length)]));

    setTimeout(() => {
      setGrid(newGrid);
      calculateWinnings(newGrid);
      setSpinning(false);
    }, 2000);
  };

  const calculateWinnings = (newGrid) => {
    let totalMultiplier = 1;
    let hasBomb = false;

    newGrid.flat().forEach((symbol) => {
      if (symbol === "💣") hasBomb = true;
      if (gemMultipliers[symbol]) totalMultiplier *= gemMultipliers[symbol];
    });
    
    setMoney(hasBomb ? 0 : Math.round(money * totalMultiplier));
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>💰 Money: {money} 💰</h1>
      <div className={styles.slotGrid}>
        {grid.map((row, rowIndex) => (
          <div key={rowIndex} className={styles.row}>
            {row.map((symbol, colIndex) => (
              <div key={colIndex} className={`${styles.slot} ${spinning ? styles.spin : ""}`}>{symbol}</div>
            ))}
          </div>
        ))}
      </div>
      <button className={styles.spinButton} onClick={spin} disabled={spinning}>
        {spinning ? "Spinning..." : "🎰 Spin"}
      </button>
    </div>
  );
};

export default SlotGame;

