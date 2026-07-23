import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import StudentGroup from '@tdev-models/StudentGroup';
import { Access, CodeType } from '@tdev-api/document';
import CodeEditorComponent from '@tdev-components/documents/CodeEditor';
import iCode from '@tdev-models/documents/iCode';
import AccessSelector, { AccessNames } from '@tdev-components/PermissionsPanel/AccessSelector';
import Badge from '@tdev-components/shared/Badge';
import GroupAccessSelector from '@tdev-components/PermissionsPanel/AccessSelector/GroupAccessSelector';
import SharedAccessSelector from '@tdev-components/PermissionsPanel/AccessSelector/SharedAccessSelector';

interface Props {
    group: StudentGroup;
}

const DocumentPresentationView = observer((props: Props) => {
    const componentStore = useStore('componentStore');
    const userStore = useStore('userStore');
    const permissionStore = useStore('permissionStore');
    const { group } = props;
    if (!group.presentedDocument) {
        return <div>Keine Präsentation</div>;
    }
    const docType = group.presentedDocument.type;
    const EC = componentStore.editorComponent(docType as CodeType);
    if (!EC) {
        return <div>Kein Editor für Dokumenttyp {docType}</div>;
    }
    const groupPermission = permissionStore
        .groupPermissionsByDocumentRoot(group.presentedDocument?.documentRootId)
        .find((p) => p.groupId === group.id)?.access;

    return (
        <div className={clsx(styles.DocumentPresentationView)}>
            {userStore.current?.hasElevatedAccess && (
                <div className={clsx(styles.presentationInfo)}>
                    group
                    <GroupAccessSelector group={group} />
                </div>
            )}
            <div>
                shared
                <SharedAccessSelector
                    documentRoot={group.presentedDocument.root!}
                    maxAccess={groupPermission}
                />
            </div>
            <CodeEditorComponent code={group.presentedDocument as iCode<CodeType>} isPresentation />
        </div>
    );
});

export default DocumentPresentationView;
