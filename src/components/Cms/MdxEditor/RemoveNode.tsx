import React from 'react';
import _ from 'es-toolkit/compat';
import { useLexicalNodeRemove } from '@mdxeditor/editor';
import { mdiClose, mdiCloseBox } from '@mdi/js';
import clsx from 'clsx';
import { Confirm } from '@tdev-components/shared/Button/Confirm';

export interface Props {
    className?: string;
    buttonClassName?: string;
    onRemove?: () => void;
    size?: number;
}

const useRemover = (onRemove?: () => void) => {
    if (onRemove) {
        return onRemove;
    }
    const remover = useLexicalNodeRemove();
    return remover;
};

const RemoveNode = (props: Props) => {
    const remover = useRemover(props.onRemove);
    return (
        <span className={clsx(props.className)}>
            <Confirm
                buttonClassName={clsx(props.buttonClassName)}
                icon={mdiClose}
                confirmIcon={mdiCloseBox}
                text={null}
                confirmText="Entfernen"
                title="Block entfernen"
                color="black"
                size={props.size}
                onConfirm={() => {
                    remover();
                }}
            />
        </span>
    );
};

export default RemoveNode;
