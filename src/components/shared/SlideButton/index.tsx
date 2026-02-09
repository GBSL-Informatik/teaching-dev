import React, { useRef, useState } from 'react';
import styles from './styles.module.scss';
import Icon from '@mdi/react';
import { mdiArrowRightBoldBox, mdiCheckCircle, mdiCloseCircle } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import { observer } from 'mobx-react-lite';
import clsx from 'clsx';

const SLIDER_WIDTH = 320; // px
const HANDLE_SIZE = 32; // px
const THRESHOLD = 0.85; // %

interface Props {
    onUnlock: () => void;
    onReset?: () => void;
    isUnlocked?: boolean;
    text?: string;
    unlockedText?: string;
    sliderWidth?: number;
    title?: string;
    disabled?: boolean;
}

const SlideButton = observer((props: Props) => {
    const { onUnlock, text, sliderWidth = SLIDER_WIDTH } = props;
    const trackRef = useRef<HTMLDivElement | null>(null);
    const [dragging, setDragging] = useState(false);
    const [offset, setOffset] = useState(props.isUnlocked ? sliderWidth - HANDLE_SIZE : 0);
    const [unlocked, setUnlocked] = useState(props.isUnlocked ?? false);

    const getRelativeX = (clientX: number) => {
        const rect = trackRef.current!.getBoundingClientRect();
        const x = Math.max(0, Math.min(clientX - rect.left, sliderWidth - HANDLE_SIZE));
        return x;
    };

    React.useEffect(() => {
        if (props.isUnlocked === undefined) {
            return;
        }
        setUnlocked(props.isUnlocked);
        if (!props.isUnlocked) {
            setOffset(0);
        } else {
            setOffset(sliderWidth - HANDLE_SIZE);
        }
    }, [props.isUnlocked]);

    const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
        if (unlocked) return;
        setDragging(true);
        e.preventDefault();
    };

    const handleDragMove = (e: MouseEvent | TouchEvent) => {
        if (!dragging || unlocked) return;
        let clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
        setOffset(getRelativeX(clientX));
    };

    const handleDragEnd = () => {
        if (!dragging || unlocked) return;
        const progress = offset / (sliderWidth - HANDLE_SIZE);
        if (progress >= THRESHOLD) {
            setOffset(sliderWidth - HANDLE_SIZE);
            setUnlocked(true);
            onUnlock();
        } else {
            setOffset(0);
        }
        setDragging(false);
    };

    React.useEffect(() => {
        const moveListener = (e: MouseEvent | TouchEvent) => handleDragMove(e);
        const upListener = () => handleDragEnd();
        if (dragging) {
            window.addEventListener('mousemove', moveListener);
            window.addEventListener('touchmove', moveListener, { passive: false });
            window.addEventListener('mouseup', upListener);
            window.addEventListener('touchend', upListener);
        }
        return () => {
            window.removeEventListener('mousemove', moveListener);
            window.removeEventListener('touchmove', moveListener);
            window.removeEventListener('mouseup', upListener);
            window.removeEventListener('touchend', upListener);
        };
    }, [dragging, offset, unlocked]);

    return (
        <div className={clsx(styles.container, props.disabled && styles.disabled)} title={props.title}>
            <div
                className={clsx(styles.track, unlocked && styles.unlocked)}
                ref={trackRef}
                style={{ width: sliderWidth }}
            >
                {props.onReset && unlocked && (
                    <div className={styles.resetButton}>
                        <Button
                            disabled={props.disabled}
                            icon={mdiCloseCircle}
                            color="red"
                            size={SIZE_S}
                            noBorder
                            title="Zurücksetzen"
                            onClick={() => {
                                setUnlocked(false);
                                setOffset(0);
                                props.onReset?.();
                            }}
                        />
                    </div>
                )}
                <span className={styles.text}>{unlocked ? props.unlockedText : (text ?? 'Ziehen')}</span>
                <div
                    className={clsx(
                        styles.handle,
                        dragging && styles.dragging,
                        unlocked && styles.handleUnlocked
                    )}
                    title={props.disabled ? 'Deakitiviert' : unlocked ? undefined : 'Ziehen zum Entsperren'}
                    style={{ left: unlocked ? undefined : offset }}
                    onMouseDown={props.disabled ? undefined : handleDragStart}
                    onTouchStart={props.disabled ? undefined : handleDragStart}
                    tabIndex={0}
                >
                    <span className={clsx(styles.arrow)}>
                        <Icon
                            path={unlocked ? mdiCheckCircle : mdiArrowRightBoldBox}
                            size={1}
                            color={unlocked ? 'white' : 'var(--ifm-color-blue-darkest)'}
                            className={clsx(styles.arrowIcon)}
                        />
                    </span>
                </div>
                <div className={clsx(styles.progress)} style={{ width: offset + HANDLE_SIZE / 2 }} />
            </div>
        </div>
    );
});

export default SlideButton;
