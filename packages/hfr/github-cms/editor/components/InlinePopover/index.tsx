import { mdiClose } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import Card from '@tdev-components/shared/Card';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import clsx from 'clsx';
import React from 'react';
import { createPortal } from 'react-dom';
import { useFloatingPlacement } from '../useFloatingPlacement';
import styles from './styles.module.scss';

interface Props {
    /** the element that opens the popover when clicked, e.g. the rendered inline node */
    trigger: React.ReactElement;
    title: string;
    /** a function receives `close`, e.g. to close the popover once the changes are applied */
    children: React.ReactNode | ((close: () => void) => React.ReactNode);
    /** called when the popover is closed with its trigger, with Escape or with `close`, e.g. to focus the editor again */
    onClose?: () => void;
}

/** dialogs opened from within the popover (e.g. the attributes editor) are rendered there */
const MODAL_ROOT = '#popup-root';

/**
 * Edits the attributes of an inline node (math, icons, raw mdx...) or a link in a popover,
 * centered below the trigger or above it, when there is not enough space below.
 */
const InlinePopover = (props: Props) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [anchor, setAnchor] = React.useState<HTMLSpanElement | null>(null);
    const [popover, setPopover] = React.useState<HTMLDivElement | null>(null);
    const placement = useFloatingPlacement(anchor, isOpen ? popover : null);
    const { onClose } = props;

    const close = React.useCallback(() => {
        setIsOpen(false);
        onClose?.();
    }, [onClose]);

    React.useEffect(() => {
        if (!anchor || !popover) {
            return;
        }
        // While the popover has the focus, ProseMirror must not handle a click on the trigger: it would focus
        // the editor at its start. `onClose` gives the focus back instead. A native listener is needed, since
        // ProseMirror handles the event before React.
        const handleMouseDown = (event: MouseEvent) => {
            if (popover.contains(document.activeElement)) {
                event.preventDefault();
            }
        };
        anchor.addEventListener('mousedown', handleMouseDown);
        return () => anchor.removeEventListener('mousedown', handleMouseDown);
    }, [anchor, popover]);

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
                close();
            }
        };
        document.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, anchor, popover, close]);

    return (
        <>
            <span ref={setAnchor} onClick={isOpen ? close : () => setIsOpen(true)}>
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
                            header={
                                <div className={clsx(styles.header)}>
                                    <h5>{props.title}</h5>
                                    <Button
                                        icon={mdiClose}
                                        size={SIZE_S}
                                        title="Schliessen"
                                        onClick={close}
                                    />
                                </div>
                            }
                            classNames={{ card: styles.card, body: clsx(styles.body) }}
                        >
                            {typeof props.children === 'function' ? props.children(close) : props.children}
                        </Card>
                    </div>,
                    document.body
                )}
        </>
    );
};

export default InlinePopover;
