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
import useIsBrowser from '@docusaurus/useIsBrowser';

interface Props extends MetaInit {
    id: string;
    children: React.ReactNode;
    access?: Access;
}

const Restricted = observer((props: Props) => {
    const meta = React.useMemo(() => new ModelMeta(props), [props.id]);
    const isBrowser = useIsBrowser();
    const userStore = useStore('userStore');
    const docRoot = useDocumentRoot(props.id, meta, false, {
        access: props.access || Access.None_DocumentRoot
    });
    if (!isBrowser) {
        return null;
    }
    if (!docRoot || docRoot.isDummy) {
        if (!!userStore.current) {
            return <Loader />;
        } else {
            return null;
        }
    }
    return (
        <div className={styles.wrapper}>
            {!NoneAccess.has(props.access) &&
            (!NoneAccess.has(docRoot.permission) || userStore.current?.hasElevatedAccess) ? (
                <div>{props.children}</div>
            ) : null}
            <div className={styles.adminControls}>
                {userStore.current?.hasElevatedAccess && <PermissionsPanel documentRootId={docRoot.id} />}
                {userStore.current?.hasElevatedAccess && (
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
