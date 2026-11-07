import { mdiClose, mdiCloseBox } from '@mdi/js';
import { Confirm } from '@tdev-components/shared/Button/Confirm';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import type { NodeViewHandle } from '../../nodeViews/ReactNodeView';
import styles from './styles.module.scss';

interface Props {
    handle: NodeViewHandle;
    title: React.ReactNode;
    children?: React.ReactNode;
    className?: string;
}

/**
 * The (non-editable) header of a component node: its name, controls and a remove button.
 * Clicking on the header selects the node, e.g. to move it with drag and drop.
 */
const NodeToolbar = observer((props: Props) => {
    const { handle } = props;
    return (
        <div className={clsx(styles.toolbar, props.className)} onClick={() => handle.select()}>
            <span className={clsx(styles.title)}>{props.title}</span>
            <span className={clsx(styles.controls)} onClick={(e) => e.stopPropagation()}>
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
            </span>
        </div>
    );
});

export default NodeToolbar;
