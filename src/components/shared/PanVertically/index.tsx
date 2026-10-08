import clsx from 'clsx';
import * as React from 'react';
import styles from './styles.module.scss';

type HandleProps = Omit<
    React.HTMLAttributes<HTMLDivElement>,
    | 'children'
    | 'dangerouslySetInnerHTML'
    | 'onPointerDown'
    | 'onPointerMove'
    | 'onPointerUp'
    | 'onPointerCancel'
    | 'onLostPointerCapture'
>;

export interface Props extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
    children: React.ReactNode;
    /** Show the resize handle and enable pan gestures. Defaults to true. */
    enabled?: boolean;
    /** Return false to prevent the gesture from starting. */
    onPanStart?: () => void | false;
    /** Total displacement from the start in pixels; positive values move downward. */
    onPan?: (deltaY: number) => void;
    onPanEnd?: () => void;
    handleProps?: HandleProps;
}

const PanVertically = (props: Props) => {
    const { children, enabled = true, onPanStart, onPan, onPanEnd, handleProps, ...wrapperProps } = props;
    const panRef = React.useRef<{
        pointerId: number;
        startY: number;
        handle: HTMLDivElement;
    } | null>(null);
    const [isPanning, setIsPanning] = React.useState(false);

    const endPan = () => {
        const pan = panRef.current;
        if (!pan) {
            return;
        }
        panRef.current = null;
        if (pan.handle.hasPointerCapture(pan.pointerId)) {
            pan.handle.releasePointerCapture(pan.pointerId);
        }
        setIsPanning(false);
        onPanEnd?.();
    };
    const onPointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
        if (panRef.current?.pointerId === event.pointerId) {
            endPan();
        }
    };

    React.useEffect(() => {
        if (!enabled) {
            endPan();
        }
    }, [enabled]);

    React.useEffect(() => {
        return () => {
            const pan = panRef.current;
            panRef.current = null;
            if (pan?.handle.hasPointerCapture(pan.pointerId)) {
                pan.handle.releasePointerCapture(pan.pointerId);
            }
        };
    }, []);

    return (
        <div {...wrapperProps}>
            {children}
            {enabled && (
                <div
                    role="separator"
                    aria-label="Höhe anpassen"
                    aria-orientation="horizontal"
                    tabIndex={0}
                    {...handleProps}
                    className={clsx(styles.handle, isPanning && styles.panning, handleProps?.className)}
                    onPointerDown={(event) => {
                        if (event.button !== 0 || !event.isPrimary || panRef.current) {
                            return;
                        }
                        if (onPanStart?.() === false) {
                            return;
                        }
                        event.preventDefault();
                        event.currentTarget.focus();
                        event.currentTarget.setPointerCapture(event.pointerId);
                        panRef.current = {
                            pointerId: event.pointerId,
                            startY: event.clientY,
                            handle: event.currentTarget
                        };
                        setIsPanning(true);
                    }}
                    onPointerMove={(event) => {
                        const pan = panRef.current;
                        if (pan?.pointerId === event.pointerId) {
                            onPan?.(event.clientY - pan.startY);
                        }
                    }}
                    onPointerUp={onPointerEnd}
                    onPointerCancel={onPointerEnd}
                    onLostPointerCapture={onPointerEnd}
                    onKeyDown={(event) => {
                        if ((event.key === 'Enter' || event.key === 'Escape') && panRef.current) {
                            event.preventDefault();
                            endPan();
                        }
                        handleProps?.onKeyDown?.(event);
                    }}
                />
            )}
        </div>
    );
};

export default PanVertically;
