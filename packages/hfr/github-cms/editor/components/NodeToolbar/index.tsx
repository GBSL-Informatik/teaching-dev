import { mdiClose, mdiCloseBox } from '@mdi/js';
import { Confirm } from '@tdev-components/shared/Button/Confirm';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
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
    children?: React.ReactNode;
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
    const [controls, setControls] = React.useState<HTMLSpanElement | null>(null);
    const isCompact = useIsCompact(toolbar, controls);

    const allControls = (
        <>
            {props.children}
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

    return (
        <div
            ref={setToolbar}
            className={clsx(styles.toolbar, props.className)}
            onClick={() => handle.select()}
        >
            <span className={clsx(styles.title)}>{props.title}</span>
            {/* events from the modal bubble through the portal: they must not select the node */}
            <span
                ref={isCompact ? undefined : setControls}
                className={clsx(styles.controls)}
                onClick={(e) => e.stopPropagation()}
            >
                {isCompact ? <ControlsModal title={props.title}>{allControls}</ControlsModal> : allControls}
            </span>
        </div>
    );
});

export default NodeToolbar;
