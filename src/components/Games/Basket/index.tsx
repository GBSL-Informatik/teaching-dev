// App.tsx
import React, { useState, useEffect, useRef } from 'react';
import styles from './styles.module.scss';

interface BasketPosition {
    x: number;
    y: number;
}

interface Ball {
    x: number;
    y: number;
    velocityX: number;
    velocityY: number;
    isShot: boolean;
}

const BasketGame: React.FC = () => {
    const [score, setScore] = useState<number>(0);
    const [timeLeft, setTimeLeft] = useState<number>(60); // 60 seconds game
    const [gameActive, setGameActive] = useState<boolean>(false);
    const [ball, setBall] = useState<Ball>({
        x: 50,
        y: 80,
        velocityX: 0,
        velocityY: 0,
        isShot: false
    });
    const [power, setPower] = useState<number>(0);
    const [angle, setAngle] = useState<number>(45);
    const [isPowerCharging, setIsPowerCharging] = useState<boolean>(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);
    const basketPosition: BasketPosition = { x: 75, y: 20 };

    // Start or restart game
    const startGame = () => {
        setScore(0);
        setTimeLeft(60);
        resetBall();
        setGameActive(true);
    };

    // Reset ball position
    const resetBall = () => {
        setBall({
            x: 50,
            y: 80,
            velocityX: 0,
            velocityY: 0,
            isShot: false
        });
    };

    // Game timer
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (gameActive && timeLeft > 0) {
            timer = setTimeout(() => {
                setTimeLeft(timeLeft - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setGameActive(false);
        }

        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [gameActive, timeLeft]);

    // Power charging
    useEffect(() => {
        let powerInterval: NodeJS.Timeout;

        if (isPowerCharging) {
            powerInterval = setInterval(() => {
                setPower((prevPower) => {
                    const newPower = prevPower + 2;
                    if (newPower >= 100) {
                        setIsPowerCharging(false);
                        return 100;
                    }
                    return newPower;
                });
            }, 100);
        }

        return () => {
            if (powerInterval) clearInterval(powerInterval);
        };
    }, [isPowerCharging]);

    // Ball physics and animation
    useEffect(() => {
        if (!canvasRef.current || !gameActive) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const drawGame = () => {
            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw backboard
            ctx.fillStyle = '#888';
            ctx.fillRect(
                (basketPosition.x * canvas.width) / 100 - 10,
                (basketPosition.y * canvas.height) / 100 - 30,
                20,
                40
            );

            // Draw basket
            ctx.beginPath();
            ctx.arc(
                (basketPosition.x * canvas.width) / 100,
                (basketPosition.y * canvas.height) / 100,
                15,
                0,
                Math.PI,
                true
            );
            ctx.strokeStyle = 'orange';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Draw net
            ctx.beginPath();
            ctx.moveTo(
                (basketPosition.x * canvas.width) / 100 - 15,
                (basketPosition.y * canvas.height) / 100
            );
            ctx.lineTo(
                (basketPosition.x * canvas.width) / 100 - 10,
                (basketPosition.y * canvas.height) / 100 + 20
            );
            ctx.lineTo(
                (basketPosition.x * canvas.width) / 100 + 10,
                (basketPosition.y * canvas.height) / 100 + 20
            );
            ctx.lineTo(
                (basketPosition.x * canvas.width) / 100 + 15,
                (basketPosition.y * canvas.height) / 100
            );
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Draw ball
            ctx.beginPath();
            ctx.arc((ball.x * canvas.width) / 100, (ball.y * canvas.height) / 100, 10, 0, Math.PI * 2);
            ctx.fillStyle = '#ff6600';
            ctx.fill();
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Draw basketball lines
            ctx.beginPath();
            ctx.arc(
                (ball.x * canvas.width) / 100,
                (ball.y * canvas.height) / 100,
                10,
                Math.PI / 4,
                Math.PI / 4 + Math.PI,
                false
            );
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(
                (ball.x * canvas.width) / 100,
                (ball.y * canvas.height) / 100,
                10,
                -Math.PI / 4,
                -Math.PI / 4 + Math.PI,
                false
            );
            ctx.stroke();

            // Draw shooting guide if not shot
            if (!ball.isShot) {
                ctx.beginPath();
                ctx.moveTo((ball.x * canvas.width) / 100, (ball.y * canvas.height) / 100);
                ctx.lineTo(
                    (ball.x * canvas.width) / 100 + Math.cos(((angle - 90) * Math.PI) / 180) * 50,
                    (ball.y * canvas.height) / 100 + Math.sin(((angle - 90) * Math.PI) / 180) * 50
                );
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        };

        const updateBall = () => {
            if (ball.isShot) {
                // Apply gravity
                const gravity = 0.2;

                // Update ball position
                const newBall = { ...ball };
                newBall.velocityY += gravity;
                newBall.x += newBall.velocityX;
                newBall.y += newBall.velocityY;

                // Check if ball is in the basket
                const basketX = basketPosition.x;
                const basketY = basketPosition.y;
                const distance = Math.sqrt(
                    Math.pow(newBall.x - basketX, 2) + Math.pow(newBall.y - basketY, 2)
                );

                // Score if the ball passes through the basket
                if (distance < 5 && newBall.y > basketY && newBall.velocityY > 0) {
                    setScore((prevScore) => prevScore + 2);
                    // Reset ball after a short delay
                    setTimeout(() => {
                        resetBall();
                    }, 500);
                    return;
                }

                // Reset ball if it goes out of bounds
                if (newBall.y > 100 || newBall.x < 0 || newBall.x > 100) {
                    console.log('reset ball');
                    return resetBall();
                }

                setBall(newBall);
            }
        };

        const animate = () => {
            updateBall();
            drawGame();
            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(animationRef.current);
        };
    }, [ball, gameActive, basketPosition, angle]);

    // Start power charging
    const startChargingPower = () => {
        if (!ball.isShot && gameActive) {
            setPower(0);
            setIsPowerCharging(true);
        }
    };

    // Shoot the ball
    const shootBall = () => {
        if (!ball.isShot && gameActive && isPowerCharging) {
            setIsPowerCharging(false);

            const powerFactor = power / 20; // Adjust for reasonable velocity

            setBall({
                ...ball,
                velocityX: Math.cos(((angle - 90) * Math.PI) / 180) * powerFactor,
                velocityY: Math.sin(((angle - 90) * Math.PI) / 180) * powerFactor,
                isShot: true
            });
        }
    };

    // Change shooting angle
    const changeAngle = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAngle(Number(e.target.value));
    };

    return (
        <div className={styles.basketballGame}>
            <div className={styles.scoreboard}>
                <div className={styles.scoreDisplay}>Score: {score}</div>
                <div className={styles.timeDisplay}>Zeit: {timeLeft}s</div>
            </div>

            <div className={styles.gameContainer}>
                <canvas ref={canvasRef} width={800} height={600} className={styles.gameCanvas} />

                {!gameActive && (
                    <div className={styles.gameOverlay}>
                        {timeLeft === 0 ? (
                            <div className={styles.gameOver}>
                                <h2>Game Over!</h2>
                                <p>Final Score: {score}</p>
                                <button onClick={startGame}>Play Again</button>
                            </div>
                        ) : (
                            <div className={styles.gameStart}>
                                <h2>Basketball Shooter</h2>
                                <button onClick={startGame}>Start Game</button>
                            </div>
                        )}
                    </div>
                )}

                {gameActive && !ball.isShot && (
                    <div className={styles.controls}>
                        <div className={styles.angleControl}>
                            <label>Winkel: {angle}°</label>
                            <input type="range" min="0" max="90" value={angle} onChange={changeAngle} />
                        </div>

                        <div className={styles.powerControl}>
                            <div className={styles.powerBarContainer}>
                                <div className={styles.powerBar} style={{ width: `${power}%` }} />
                            </div>
                            <button
                                className={styles.shootButton}
                                onMouseDown={startChargingPower}
                                onMouseUp={shootBall}
                                onTouchStart={startChargingPower}
                                onTouchEnd={shootBall}
                            >
                                {isPowerCharging ? 'Loslassen zum werfen!' : 'Drücken to Power Up'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BasketGame;
