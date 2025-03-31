import React from "react";
import styles from "./styles.module.css";

const ColorBox = ({ nr }) => {
  const [color, setColor] = React.useState("green");
  return (
    <div
      className={styles.colorBox}
      style={{ background: color }}
      onClick={() => {
        const r = Math.random() * 255;
        const g = Math.random() * 255;
        const b = Math.random() * 255;
        setColor(`rgb(${r},${g},${b})`);
      }}
    >
      ColorBox {nr}
    </div>
  );
};

export default ColorBox;
