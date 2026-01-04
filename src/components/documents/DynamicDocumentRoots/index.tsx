import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useFirstRealMainDocument } from '@tdev-hooks/useFirstRealMainDocument';
import {
    MetaInit,
    ModelMeta,
    default as DynamicDocumentRootsModel
} from '@tdev-models/documents/DynamicDocumentRoots';
import PermissionsPanel from '@tdev-components/PermissionsPanel';
import { Access, ContainerType } from '@tdev-api/document';
import { useStore } from '@tdev-hooks/useStore';
import AddDynamicDocumentRoot from './AddDynamicDocumentRoot';
import { NotCreated } from '@tdev-components/Rooms';
import DocumentContainer from './DocumentContainer';

interface Props<T extends ContainerType> extends MetaInit<T> {
    id: string;
    type: T;
}

const DynamicDocumentRoots = observer((props: Props<ContainerType>) => {
    const [meta] = React.useState(new ModelMeta({ containerType: props.type }));
    const userStore = useStore('userStore');
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
    }) as DynamicDocumentRootsModel<ContainerType> | undefined;
    React.useEffect(() => {
        if (doc && doc.linkedDocumentContainersMap.size === 0) {
            doc.loadDocumentRoots();
        }
    }, [doc, props.id]);
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
                <h3>{doc.defaultContainerMeta.name || 'Gruppe'}</h3>
                <PermissionsPanel documentRootId={props.id} />
            </div>
            <div className={clsx(styles.body, 'card__body')}>
                <div className={clsx(styles.actions)}>
                    <AddDynamicDocumentRoot dynamicDocumentRoot={doc} />
                </div>
                {doc.linkedDocumentContainers.map((container) => {
                    return <DocumentContainer key={container.id} docContainer={container} />;
                })}
            </div>
        </div>
    );
});

export default DynamicDocumentRoots;
