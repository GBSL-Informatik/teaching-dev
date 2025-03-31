import React, { useState, useEffect } from 'react';
import styles from './styles.module.scss';

const words: string[] = [
    'ALGORITHMUS',
    'INTEGRAL',
    'MATRIX',
    'FUNKTION',
    'REKURSION',
    'VEKTOR',
    'POLYNOM',
    'PRIMZAHL',
    'COMPILER',
    'DATENBANK',
    'VERSCHLÜSSELUNG',
    'BINÄRSYSTEM',
    'KOMPLEXITÄT',
    'ITERATION',
    'LOGARITHMUS',
    'VARIABLE',
    'TOPOLOGIE',
    'QUANTENBIT',
    'FIBONACCI',
    'INFORMATIK',
    'LOVELACE',
    'CURIE',
    'MEITNER',
    'FRANKLIN',
    'HOPPER',
    'NOETHER',
    'HAMILTON',
    'JOHNSON',
    'YALOW',
    'JEMISON',
    'HYPATIA',
    'CARSON',
    'LAMARR',
    'BRAUN',
    'HERSCHEL'
];

type GameStatus = 'playing' | 'won' | 'lost';

const Hangman: React.FC = () => {
    const [word, setWord] = React.useState<string>('');
    const [guessedLetters, setGuessedLetters] = React.useState<string[]>([]);
    const [wrongGuesses, setWrongGuesses] = React.useState<number>(0);
    const [gameStatus, setGameStatus] = React.useState<GameStatus>('playing');

    // Initialize game
    useEffect(() => {
        startNewGame();
    }, []);

    const startNewGame = (): void => {
        const randomWord = words[Math.floor(Math.random() * words.length)];
        setWord(randomWord);
        setGuessedLetters([]);
        setWrongGuesses(0);
        setGameStatus('playing');
    };

    const handleGuess = (letter: string): void => {
        if (gameStatus !== 'playing' || guessedLetters.includes(letter)) return;

        const newGuessedLetters = [...guessedLetters, letter];
        setGuessedLetters(newGuessedLetters);

        if (!word.includes(letter)) {
            const newWrongGuesses = wrongGuesses + 1;
            setWrongGuesses(newWrongGuesses);

            if (newWrongGuesses >= 6) {
                setGameStatus('lost');
            }
        } else {
            // Check if player has won
            const isWon = word.split('').every((char) => newGuessedLetters.includes(char));
            if (isWon) {
                setGameStatus('won');
            }
        }
    };

    const renderWord = (): React.ReactNode[] => {
        return word.split('').map((letter, index) => (
            <span key={index} className={styles.letter}>
                {guessedLetters.includes(letter) ? letter : '_'}
            </span>
        ));
    };

    const renderKeyboard = (): React.ReactNode[] => {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        return alphabet.map((letter) => (
            <button
                key={letter}
                className={`${styles.keyboardButton} ${guessedLetters.includes(letter) ? styles.guessed : ''}`}
                onClick={() => handleGuess(letter)}
                disabled={guessedLetters.includes(letter) || gameStatus !== 'playing'}
            >
                {letter}
            </button>
        ));
    };

    const renderHangman = (): React.ReactNode => {
        return (
            <div className={styles.hangmanDrawing}>
                {/* Base */}
                <div className={styles.base}></div>

                {/* Pole */}
                {wrongGuesses > 0 && <div className={styles.pole}></div>}

                {/* Top */}
                {wrongGuesses > 1 && <div className={styles.top}></div>}

                {/* Rope */}
                {wrongGuesses > 2 && <div className={styles.rope}></div>}

                {/* Head */}
                {wrongGuesses > 3 && <div className={styles.head}></div>}

                {/* Body */}
                {wrongGuesses > 4 && <div className={styles.body}></div>}

                {/* Arms and Legs */}
                {wrongGuesses > 5 && (
                    <>
                        <div className={styles.arms}></div>
                        <div className={styles.legs}></div>
                    </>
                )}
            </div>
        );
    };

    return (
        <div className={styles.hangmanGame}>
            <h1>Hangman</h1>

            {renderHangman()}

            <div className={styles.wordContainer}>{renderWord()}</div>

            {gameStatus === 'won' && (
                <div className={styles.message}>Yay 🥳! Gewonnen - schaffst du jetzt auch das Rätsel?</div>
            )}

            {gameStatus === 'lost' && (
                <div className={styles.message}>Spiel vorbei! Das Wort war: {word}</div>
            )}

            <div className={styles.keyboard}>{renderKeyboard()}</div>

            <button className={styles.newGameButton} onClick={startNewGame}>
                Neues Spiel
            </button>
        </div>
    );
};

export default Hangman;
