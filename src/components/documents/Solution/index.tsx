import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import Details from '@theme/Details';
import Loader from '@tdev-components/Loader';
import { MetaInit, ModelMeta } from '@tdev-models/documents/Solution';
import { useDocumentRoot } from '@tdev-hooks/useDocumentRoot';
import { Access } from '@tdev-api/document';
import { useStore } from '@tdev-hooks/useStore';
import Icon from '@mdi/react';
import { mdiCheckAll } from '@mdi/js';
import PermissionsPanel from '@tdev-components/PermissionsPanel';
import { NoneAccess } from '@tdev-models/helpers/accessPolicy';
import AccessBadge from '@tdev-components/PermissionsPanel/AccessBadge';

interface Props extends MetaInit {
    id: string;
    standalone?: boolean;
    title?: string;
    open?: boolean;
    className?: string;
    children: React.ReactNode;
    access?: Access;
}

const Solution = observer((props: Props) => {
    const [meta] = React.useState(new ModelMeta(props));
    const docRoot = useDocumentRoot(props.id, meta, false, { access: Access.None_DocumentRoot });
    const userStore = useStore('userStore');
    if (!docRoot || docRoot.isDummy) {
        return <Loader />;
    }
    return (
        <div className={clsx(styles.wrapper, props.standalone && styles.standalone)}>
            {!NoneAccess.has(props.access) &&
            (!NoneAccess.has(docRoot.permission) || userStore.current?.isAdmin) ? (
                <Details
                    summary={
                        <summary>
                            <div className={styles.summary}>
                                {props.title || 'Lösung'}
                                <div style={{ flex: '1 1 0' }} />
                                {userStore.current?.isAdmin && (
                                    <PermissionsPanel documentRootId={docRoot.id} />
                                )}
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
                                <Icon
                                    path={mdiCheckAll}
                                    className={styles.summaryIcon}
                                    size={1}
                                    color="var(--ifm-color-success)"
                                />
                            </div>
                        </summary>
                    }
                    className={clsx('alert alert--success', styles.solution)}
                    open={props.open}
                    key={`poly-${props.open}`}
                >
                    <div className={clsx(props.className)}>{props.children}</div>
                </Details>
            ) : (
                <div className={clsx('alert', styles.disabled)}>
                    {props.title || 'Lösung'} (nicht freigeschaltet) <Icon path={mdiCheckAll} size={1} />
                </div>
            )}
        </div>
    );
});

export default Solution;
