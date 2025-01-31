import React from 'react';
import _ from 'lodash';
import { useLexicalNodeRemove } from '@mdxeditor/editor';
import { mdiClose, mdiCloseBox } from '@mdi/js';
import clsx from 'clsx';
import { Confirm } from '@tdev-components/shared/Button/Confirm';

export interface Props {
    className?: string;
}

const RemoveJsxNode = (props: Props) => {
    const remover = useLexicalNodeRemove();
    return (
        <span className={clsx(props.className)}>
            <Confirm
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
