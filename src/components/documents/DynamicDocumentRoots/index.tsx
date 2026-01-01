import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useFirstRealMainDocument } from '@tdev-hooks/useFirstRealMainDocument';
import { MetaInit, ModelMeta } from '@tdev-models/documents/DynamicDocumentRoots';
import PermissionsPanel from '@tdev-components/PermissionsPanel';
import { Access } from '@tdev-api/document';
import { useStore } from '@tdev-hooks/useStore';
import AddDynamicDocumentRoot from './AddDynamicDocumentRoot';
import DynamicDocumentRoot from './DynamicDocumentRoot';
import { NotCreated } from '@tdev-components/Rooms';
import Badge from '@tdev-components/shared/Badge';

interface Props extends MetaInit {
    id: string;
    name?: string;
}

const DynamicDocumentRoots = observer((props: Props) => {
    const [meta] = React.useState(new ModelMeta(props));
    const userStore = useStore('userStore');
    const componentStore = useStore('componentStore');
    const user = userStore.current;
    const doc = useFirstRealMainDocument(props.id, meta, user?.hasElevatedAccess, {
        access: Access.RO_DocumentRoot,
        /**
         * there is only one document root for dynamic document roots
         * -> we can use RW_DocumentRoot here to give every user with
         *    "RW_UserAccess" or "RW_GroupAccess" access to the document root
         *    and provide the ability to actually create and manipulate rooms.
         */
        sharedAccess: Access.RW_DocumentRoot
    });
    if (!doc) {
        return (
            <div>
                <PermissionsPanel documentRootId={props.id} />
                <NotCreated />
            </div>
        );
    }
    return (
        <div className={clsx('card', styles.docRoots)}>
            <div className={clsx(styles.header, 'card__header')}>
                <h3>
                    {props.name || 'Gruppe'}{' '}
                    <Badge>{componentStore.components.get(doc.roomType)?.name ?? doc.roomType}</Badge>
                </h3>
                <PermissionsPanel documentRootId={props.id} />
            </div>
            <div className={clsx(styles.body, 'card__body')}>
                <div className={clsx(styles.actions)}>
                    <AddDynamicDocumentRoot dynamicDocumentRoots={doc} />
                </div>
                {doc.dynamicDocumentRoots.map((root) => {
                    return (
                        <DynamicDocumentRoot
                            key={root.id}
                            id={root.id}
                            dynamicRootsDocumentId={doc.id}
                            roomType={doc.roomType}
                        />
                    );
                })}
            </div>
        </div>
    );
});

export default DynamicDocumentRoots;
