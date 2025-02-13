import React from 'react';
import _ from 'lodash';
import { useLexicalNodeRemove } from '@mdxeditor/editor';
import { mdiClose, mdiCloseBox } from '@mdi/js';
import clsx from 'clsx';
import { Confirm } from '@tdev-components/shared/Button/Confirm';

export interface Props {
    className?: string;
    buttonClassName?: string;
    onRemove?: () => void;
}

const useRemover = (onRemove?: () => void) => {
    if (onRemove) {
        return onRemove;
    }
    const remover = useLexicalNodeRemove();
    return remover;
};

const RemoveJsxNode = (props: Props) => {
    const remover = useRemover(props.onRemove);
    return (
        <span className={clsx(props.className)}>
            <Confirm
                buttonClassName={clsx(props.buttonClassName)}
                icon={mdiClose}
                confirmIcon={mdiCloseBox}
                text={null}
                confirmText="Entfernen"
                color="black"
                onConfirm={() => {
                    remover();
                }}
            />
        </span>
    );
};

export default RemoveJsxNode;
