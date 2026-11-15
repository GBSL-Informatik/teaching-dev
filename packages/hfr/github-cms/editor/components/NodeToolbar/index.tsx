import { mdiClose, mdiCloseBox } from '@mdi/js';
import { Confirm } from '@tdev-components/shared/Button/Confirm';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import { useComputed } from '@tdev-hooks/useComputed';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import type { NodeViewHandle } from '../../nodeViews/ReactNodeView';
import ControlsModal from './ControlsModal';
import styles from './styles.module.scss';
import { useIsCompact } from './useIsCompact';

interface Props {
    handle: NodeViewHandle;
    title: React.ReactNode;
    /** the title shortens itself (e.g. with an ellipsis), so it gives way to the controls */
    shrinkTitle?: boolean;
    /** the controls take the free space instead of the title, e.g. for a source input */
    wideControls?: boolean;
    children?: React.ReactNode;
    /** e.g. the attributes editor, shown next to the remove button */
    settings?: React.ReactNode;
    /** the settings and the remove button are only shown while the node contains the selection */
    actionsWhenActive?: boolean;
    className?: string;
}

/**
 * The (non-editable) header of a component node: its name, controls and a remove button.
 * Clicking on the header selects the node, e.g. to move it with drag and drop.
 * When the controls do not fit next to the title, they are shown in a modal.
 */
const NodeToolbar = observer((props: Props) => {
    const { handle } = props;
    const [toolbar, setToolbar] = React.useState<HTMLDivElement | null>(null);
    const { isCompact, contentRef } = useIsCompact(toolbar);
    const containsSelection = useComputed(() => handle.containsSelection(), [handle]);
    const showActions = !props.actionsWhenActive || containsSelection;

    const actions = (
        <>
            {props.settings}
            <Confirm
                icon={mdiClose}
                confirmIcon={mdiCloseBox}
                text={null}
                confirmText="Entfernen"
                title="Block entfernen"
                color="black"
                size={SIZE_S}
                onConfirm={() => handle.remove()}
            />
        </>
    );
    const allControls = (
        <>
            {props.children}
            {showActions && actions}
        </>
    );

    return (
        <div
            ref={setToolbar}
            className={clsx(styles.toolbar, props.wideControls && styles.wideControls, props.className)}
            onClick={() => handle.selectAndFocus()}
        >
            <span className={clsx(styles.title, props.shrinkTitle && styles.shrink)}>{props.title}</span>
            {/* events from the modal bubble through the portal: they must not select the node */}
            <span ref={contentRef} className={clsx(styles.controls)} onClick={(e) => e.stopPropagation()}>
                {isCompact ? <ControlsModal title={props.title}>{allControls}</ControlsModal> : allControls}
            </span>
        </div>
    );
});

export default NodeToolbar;
