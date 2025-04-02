// Puzzle.tsx
import React from 'react';
import styles from './styles.module.scss';
import {
    mdiHeart,
    mdiStar,
    mdiMusic,
    mdiCake,
    mdiCat,
    mdiDog,
    mdiAirplane,
    mdiCar,
    mdiTree,
    mdiRocket,
    mdiBike,
    mdiBeach,
    mdiSubmarine,
    mdiRocketLaunch,
    mdiEarth,
    mdiPuzzle
} from '@mdi/js';
import Icon from '@mdi/react';

interface Card {
    id: number;
    type: string;
    flipped: boolean;
    solved: boolean;
}

const Puzzle = () => {
    const [cards, setCards] = React.useState<Card[]>([]);
    const [flipped, setFlipped] = React.useState<number[]>([]);
    const [solved, setSolved] = React.useState<number[]>([]);
    const [disabled, setDisabled] = React.useState<boolean>(false);
    const [moves, setMoves] = React.useState<number>(0);
    const [gameComplete, setGameComplete] = React.useState<boolean>(false);

    const icons: string[] = [
        mdiHeart,
        mdiStar,
        mdiMusic,
        mdiCake,
        mdiCat,
        mdiDog,
        mdiAirplane,
        mdiCar,
        mdiTree,
        mdiRocket,
        mdiBike,
        mdiBeach,
        mdiSubmarine,
        mdiRocketLaunch,
        mdiEarth,
        mdiPuzzle
    ];

    // Initialize the puzzle
    React.useEffect(() => {
        initializePuzzle();
    }, []);

    // Handle flipped cards
    React.useEffect(() => {
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

            setMoves((prevMoves) => prevMoves + 1);
        }
    }, [flipped, cards, solved]);

    // Check if game is complete
    React.useEffect(() => {
        if (solved.length === cards.length && cards.length > 0) {
            setGameComplete(true);
        }
    }, [solved, cards]);

    const initializePuzzle = (): void => {
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

    const handleCardClick = (index: number): void => {
        // If already flipped or solved, do nothing
        if (flipped.includes(index) || solved.includes(index) || disabled) {
            return;
        }

        // Only allow flipping two cards at a time
        if (flipped.length < 2) {
            setFlipped((prev) => [...prev, index]);
        }
    };

    const isFlipped = (index: number): boolean => {
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
                <div className={styles.completeBanner}>Fertig 🥳! Du hast {moves} Versuche gebraucht!</div>
            )}

            <button className={styles.resetButton} onClick={initializePuzzle}>
                <Icon path={mdiRocketLaunch} size={1} className={styles.buttonIcon} />
                Spiel zurücksetzen
            </button>
        </div>
    );
};

export default Puzzle;
