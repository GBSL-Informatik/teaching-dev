import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import Badge from '@tdev-components/shared/Badge';
import CopyBadge from '@tdev-components/shared/CopyBadge';
import { AccessColor, AccessIcon } from '@tdev-components/PermissionsPanel/AccessBadge';
import Icon from '@mdi/react';
import { SIZE_XS } from '@tdev-components/shared/iconSizes';
import { mdiAccount, mdiAccountGroup, mdiFileMultipleOutline, mdiShareVariantOutline } from '@mdi/js';
import { DocumentType } from '@tdev-api/document';

interface Props {
    doc: { id: string; type: DocumentType };
}

const AccessOverview = observer((props: Props) => {
    const { doc } = props;
    const docRootStore = useStore('documentRootStore');
    const viewStore = useStore('viewStore');
    const view = viewStore.permissionControl;
    const root = docRootStore.find(doc.id);
    return (
        <div className={clsx(styles.accessOverview)}>
            <Badge className={clsx(styles.typeBadge)} color={view.typeColors.get(doc.type)}>
                {doc.type}
            </Badge>
            <Badge type="secondary" title={`DocumentRoot Access: ${root?._access}`}>
                <Icon path={mdiFileMultipleOutline} size={SIZE_XS} />
                │
                <Icon path={AccessIcon(root?._access)} size={SIZE_XS} color={AccessColor(root?._access)} />
            </Badge>
            <Badge type="secondary" title={`Shared Access: ${root?._sharedAccess}`}>
                <Icon path={mdiShareVariantOutline} size={SIZE_XS} />
                │
                <Icon
                    path={AccessIcon(root?._sharedAccess)}
                    size={SIZE_XS}
                    color={AccessColor(root?._sharedAccess)}
                />
            </Badge>
            <Badge
                color={root?.groupPermissions?.length ? 'orange' : 'gray'}
                title={`Group Permissions: ${root?.groupPermissions?.length}`}
            >
                <Icon path={mdiAccountGroup} size={SIZE_XS} /> {root?.groupPermissions?.length}
            </Badge>
            <Badge
                color={root?.userPermissions?.length ? 'orange' : 'gray'}
                title={`User Permissions: ${root?.userPermissions?.length}`}
            >
                <Icon path={mdiAccount} size={SIZE_XS} /> {root?.userPermissions?.length}
            </Badge>
            <CopyBadge
                label={`${doc.id.slice(0, 8)}...`}
                title={`DocumentRoot ID: ${doc.id}`}
                value={doc.id}
            />
        </div>
    );
});

export default AccessOverview;
