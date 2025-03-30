// Puzzle.jsx
import React, { useState, useEffect } from 'react';
import styles from './styles.module.scss';
import { 
  mdiHeart, mdiStar, mdiMusic, mdiCake,
  mdiCat, mdiDog, mdiAirplane, mdiCar,
  mdiTree, mdiRocket, mdiBike, mdiBeach,
  mdiSubmarine, mdiRocketLaunch, mdiEarth, mdiPuzzle
} from '@mdi/js';
import Icon from '@mdi/react';

const Puzzle = () => {
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [solved, setSolved] = useState([]);
  const [disabled, setDisabled] = useState(false);
  const [moves, setMoves] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  
  const icons = [
    mdiHeart, mdiStar, mdiMusic, mdiCake,
    mdiCat, mdiDog, mdiAirplane, mdiCar,
    mdiTree, mdiRocket, mdiBike, mdiBeach,
    mdiSubmarine, mdiRocketLaunch, mdiEarth, mdiPuzzle
  ];
  
  // Initialize the puzzle
  useEffect(() => {
    initializePuzzle();
  }, []);
  
  // Handle flipped cards
  useEffect(() => {
    if (flipped.length === 2) {
      setDisabled(true);
      
      const [first, second] = flipped;
      
      if (cards[first].type === cards[second].type) {
        setSolved([...solved, first, second]);
        setFlipped([]);
        setDisabled(false);
      } else {
        // Wait before flipping back
        setTimeout(() => {
          setFlipped([]);
          setDisabled(false);
        }, 1000);
      }
      
      setMoves(prevMoves => prevMoves + 1);
    }
  }, [flipped, cards, solved]);
  
  // Check if game is complete
  useEffect(() => {
    if (solved.length === cards.length && cards.length > 0) {
      setGameComplete(true);
    }
  }, [solved, cards]);
  
  const initializePuzzle = () => {
    // Create pairs of cards
    const allIcons = [...icons.slice(0, 8), ...icons.slice(0, 8)];
    const shuffledCards = allIcons.map((icon, index) => ({
      id: index,
      type: icon,
      flipped: false,
      solved: false
    }));
    
    // Shuffle the cards
    for (let i = shuffledCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledCards[i], shuffledCards[j]] = [shuffledCards[j], shuffledCards[i]];
    }
    
    setCards(shuffledCards);
    setFlipped([]);
    setSolved([]);
    setDisabled(false);
    setMoves(0);
    setGameComplete(false);
  };
  
  const handleCardClick = (index) => {
    // If already flipped or solved, do nothing
    if (flipped.includes(index) || solved.includes(index) || disabled) {
      return;
    }
    
    // Only allow flipping two cards at a time
    if (flipped.length < 2) {
      setFlipped(prev => [...prev, index]);
    }
  };
  
  const isFlipped = (index) => {
    return flipped.includes(index) || solved.includes(index);
  };
  
  return (
    <div className={styles.puzzleContainer}>
      <h1 className={styles.title}>Memory Spiel</h1>
      
      <div className={styles.scoreBoard}>
        <div className={styles.moves}>Versuch: {moves}</div>
      </div>
      
      <div className={styles.puzzle}>
        {cards.map((card, index) => (
          <div
            key={card.id}
            className={`${styles.card} ${isFlipped(index) ? styles.flipped : ''} ${solved.includes(index) ? styles.solved : ''}`}
            onClick={() => handleCardClick(index)}
          >
            <div className={styles.cardInner}>
              <div className={styles.cardFront}>
                <Icon path={mdiPuzzle} size={1.5} color="#4a90e2" />
              </div>
              <div className={styles.cardBack}>
                <Icon path={card.type} size={1.5} color="#ffffff" />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {gameComplete && (
        <div className={styles.completeBanner}>
          Fertig 🥳! Du hast {moves} Versuche gebraucht!
        </div>
      )}
      
      <button className={styles.resetButton} onClick={initializePuzzle}>
        <Icon path={mdiRocketLaunch} size={1} className={styles.buttonIcon} />
        Spiel zurücksetzen
      </button>
    </div>
  );
};

export default Puzzle;