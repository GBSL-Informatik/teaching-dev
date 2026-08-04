import React from 'react';
import { observer } from 'mobx-react-lite';
import StudentGroup from '@tdev-models/StudentGroup';
import Badge from '@tdev-components/shared/Badge';
import { mdiEye, mdiMovieOpenPlay } from '@mdi/js';
import Icon from '@mdi/react';
import { SIZE_XS } from '@tdev-components/shared/iconSizes';
import { useStore } from '@tdev-hooks/useStore';
import { Access } from '@tdev-api/document';

interface Props {
    group: StudentGroup;
    hideText?: boolean;
}

const Text = observer((props: Props) => {
    const permissionStore = useStore('permissionStore');
    const { group } = props;

    if (!group.presentedDocumentProps) {
        return null;
    }
    if (
        group.presentedDocumentProps.hidePresentingUsers ||
        group.presentedDocument?.root?.sharedAccess !== Access.RW_DocumentRoot
    ) {
        return <span>Live</span>;
    }
    const rootId = group.presentedDocumentProps.document.documentRootId;
    const permissions = permissionStore.userPermissionsByDocumentRoot(rootId);
    const presentingUsers = group.students.filter(
        (u) => permissions.find((p) => p.userId === u.id)?.access === Access.RW_User
    );
    if (presentingUsers.length === 0) {
        return <span>Live</span>;
    }
    return <span>{presentingUsers.map((u) => u.firstName).join(', ')}</span>;
});

const CanEditBadge = observer((props: Props) => {
    const { group } = props;
    if (!group.presentedDocument) {
        return null;
    }

    if (group.presentedDocument.canEdit) {
        return (
            <Badge color="orange">
                <Icon path={mdiMovieOpenPlay} size={SIZE_XS} /> {props.hideText ? null : <Text {...props} />}
            </Badge>
        );
    }

    return (
        <Badge color="lightBlue">
            <Icon path={mdiEye} size={SIZE_XS} />
        </Badge>
    );
});

export default CanEditBadge;
