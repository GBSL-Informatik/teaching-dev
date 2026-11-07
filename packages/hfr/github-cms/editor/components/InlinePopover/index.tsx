import Card from '@tdev-components/shared/Card';
import clsx from 'clsx';
import React from 'react';
import { createPortal } from 'react-dom';
import { useFloatingPlacement } from '../useFloatingPlacement';
import styles from './styles.module.scss';

interface Props {
    /** the rendered inline node, opens the popover when clicked */
    trigger: React.ReactElement;
    title: string;
    children: React.ReactNode;
}

/** dialogs opened from within the popover (e.g. the attributes editor) are rendered there */
const MODAL_ROOT = '#popup-root';

/**
 * Edits the attributes of an inline node (math, icons, raw mdx...) in a popover,
 * centered below the node or above it, when there is not enough space below.
 */
const InlinePopover = (props: Props) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [anchor, setAnchor] = React.useState<HTMLSpanElement | null>(null);
    const [popover, setPopover] = React.useState<HTMLDivElement | null>(null);
    const placement = useFloatingPlacement(anchor, isOpen ? popover : null);

    React.useEffect(() => {
        if (!isOpen) {
            return;
        }
        const handleMouseDown = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (anchor?.contains(target) || popover?.contains(target) || target.closest(MODAL_ROOT)) {
                return;
            }
            setIsOpen(false);
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, anchor, popover]);

    return (
        <>
            <span ref={setAnchor} onClick={() => setIsOpen((open) => !open)}>
                {props.trigger}
            </span>
            {isOpen &&
                createPortal(
                    <div
                        ref={setPopover}
                        className={clsx(styles.popover, !placement && styles.measuring)}
                        style={placement ?? undefined}
                    >
                        <Card
                            header={<h5>{props.title}</h5>}
                            classNames={{ card: styles.card, body: clsx(styles.body) }}
                        >
                            {props.children}
                        </Card>
                    </div>,
                    document.body
                )}
        </>
    );
};

export default InlinePopover;
