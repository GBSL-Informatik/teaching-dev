import clsx from 'clsx';

import { observer } from 'mobx-react-lite';
import styles from './styles.module.scss';
import React from 'react';
import PermissionsPanel from '@tdev-components/PermissionsPanel';
import Conversation from './Text/Conversation';
import NewMessage from './Text/NewMessage';
import type { ApiRoomProps } from '@tdev-stores/ComponentStore';

const TextMessages = observer((props: ApiRoomProps): React.ReactNode => {
    const { documentRoot, apiRoomProps: dynamicDocumentRoot } = props;
    if (documentRoot.id !== dynamicDocumentRoot.id) {
        return <></>;
    }

    return (
        <div className={clsx(styles.wrapper)}>
            <div className={clsx(styles.rooms)}>
                <h1 className={clsx(styles.name)}>
                    {dynamicDocumentRoot.name} <PermissionsPanel documentRootId={documentRoot.id} />
                </h1>
                <Conversation group={documentRoot} />
                <NewMessage group={documentRoot} />
            </div>
        </div>
    );
});
export default TextMessages;
