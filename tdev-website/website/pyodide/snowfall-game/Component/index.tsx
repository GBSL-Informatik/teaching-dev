import { mdiSnowflake } from '@mdi/js';
import { useExtensionStore } from '@tdev/pyodide-code/hooks/useExtensionStore';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import type { KeyboardEvent, MouseEvent } from 'react';
import snowfallExtension from '../client';
import styles from './styles.module.scss';

interface SnowfallGameProps {
    sceneId: string;
    className?: string;
}

const SCROLL_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '];

const SnowfallGame = observer(({ sceneId, className }: SnowfallGameProps) => {
    const store = useExtensionStore(snowfallExtension);
    const scene = store.useScene(sceneId);
    const { width, height, background_color, snowflakes, dots } = scene.snapshot;

    const handleClick = (event: MouseEvent<SVGSVGElement>) => {
        event.currentTarget.focus({ preventScroll: true });
        const bounds = event.currentTarget.getBoundingClientRect();
        if (bounds.width <= 0 || bounds.height <= 0) {
            return;
        }
        const x = ((event.clientX - bounds.left) / bounds.width) * width;
        const y = ((event.clientY - bounds.top) / bounds.height) * height;
        scene.handleClick(x, y);
    };

    const handleKeyDown = (event: KeyboardEvent<SVGSVGElement>) => {
        if (!scene.isConnected) {
            return;
        }
        if (SCROLL_KEYS.includes(event.key)) {
            event.preventDefault();
        }
        scene.handleKey(event.key);
    };

    return (
        <div className={clsx(styles.container, className)}>
            <svg
                width={width}
                height={height}
                viewBox={`0 0 ${width} ${height}`}
                className={clsx(styles.scene)}
                role="application"
                aria-label={`Schneefall-Szene ${sceneId}`}
                tabIndex={0}
                onClick={handleClick}
                onKeyDown={handleKeyDown}
            >
                <rect width={width} height={height} fill={background_color} />
                <g>
                    {dots.map((dot) => (
                        <circle key={dot.id} cx={dot.x} cy={dot.y} r={dot.size} fill={dot.color} />
                    ))}
                </g>
                <g>
                    {snowflakes.map((snowflake) => (
                        <path
                            key={snowflake.id}
                            d={mdiSnowflake}
                            fill={snowflake.color}
                            transform={`translate(${snowflake.x} ${snowflake.y}) scale(${snowflake.size / 12}) translate(-12 -12)`}
                        />
                    ))}
                </g>
            </svg>
            <span role="status" className={clsx(styles.status)}>
                {scene.isConnected ? 'Klicke auf eine Schneeflocke.' : 'Starte zuerst das Python-Programm.'}
            </span>
        </div>
    );
});

export default SnowfallGame;
