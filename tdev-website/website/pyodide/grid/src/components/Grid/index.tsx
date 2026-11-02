import { useExtensionStore } from '@tdev/pyodide-code/hooks/useExtensionStore';
import clsx from 'clsx';
import { useEffect, useState, type KeyboardEvent, type MouseEvent } from 'react';
import gridExtension from '../../../client';
import GridRenderer from '../../rendering/GridRenderer';
import styles from './styles.module.scss';

interface GridProps {
    gridId: string;
    className?: string;
}

const SCROLL_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '];

const Grid = ({ gridId, className }: GridProps) => {
    const store = useExtensionStore(gridExtension);
    const grid = store.useGrid(gridId);
    const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);

    useEffect(() => {
        if (!canvas) {
            return;
        }
        return grid.attachRenderer(new GridRenderer(canvas));
    }, [canvas, grid]);

    const handleClick = (event: MouseEvent<HTMLCanvasElement>) => {
        event.currentTarget.focus({ preventScroll: true });
        const bounds = event.currentTarget.getBoundingClientRect();
        if (bounds.width <= 0 || bounds.height <= 0) {
            return;
        }
        const x = ((event.clientX - bounds.left) / bounds.width) * grid.cols;
        const y = ((event.clientY - bounds.top) / bounds.height) * grid.rows;
        grid.handleClick(x, y);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLCanvasElement>) => {
        if (!grid.isConnected) {
            return;
        }
        if (SCROLL_KEYS.includes(event.key)) {
            event.preventDefault();
        }
        grid.handleKey(event.key);
    };

    return (
        <canvas
            ref={setCanvas}
            className={clsx(styles.grid, className)}
            role="img"
            aria-label={`Gitter ${gridId}`}
            tabIndex={0}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
        >
            Gitter {gridId}
        </canvas>
    );
};

export default Grid;
