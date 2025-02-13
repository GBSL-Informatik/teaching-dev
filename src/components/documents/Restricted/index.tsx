import React from 'react';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import Loader from '@tdev-components/Loader';
import { MetaInit, ModelMeta } from '@tdev-models/documents/Restricted';
import { useDocumentRoot } from '@tdev-hooks/useDocumentRoot';
import { Access } from '@tdev-api/document';
import { useStore } from '@tdev-hooks/useStore';
import PermissionsPanel from '@tdev-components/PermissionsPanel';
import { NoneAccess } from '@tdev-models/helpers/accessPolicy';
import AccessBadge from '@tdev-components/PermissionsPanel/AccessBadge';

interface Props extends MetaInit {
    id: string;
    children: React.ReactNode;
    access?: Access;
}

const Restricted = observer((props: Props) => {
    const [meta] = React.useState(new ModelMeta(props));
    const docRoot = useDocumentRoot(props.id, meta, false, {
        access: props.access || Access.None_DocumentRoot
    });
    const userStore = useStore('userStore');
    if (!docRoot || docRoot.isDummy) {
        if (!!userStore.current) {
            return <Loader />;
        } else {
            return <div></div>;
        }
    }
    return (
        <div className={styles.wrapper}>
            {!NoneAccess.has(props.access) &&
            (!NoneAccess.has(docRoot.permission) || userStore.current?.isAdmin) ? (
                <div>{props.children}</div>
            ) : (
                <div></div>
            )}
            <div className={styles.adminControls}>
                {userStore.current?.isAdmin && <PermissionsPanel documentRootId={docRoot.id} />}
                {userStore.current?.isAdmin && (
                    <AccessBadge
                        access={
                            userStore.viewedUserId
                                ? docRoot.permissionForUser(userStore.viewedUserId)
                                : docRoot.permission
                        }
                        defaultAccess={docRoot.rootAccess}
                    />
                )}
            </div>
        </div>
    );
});

export default Restricted;
