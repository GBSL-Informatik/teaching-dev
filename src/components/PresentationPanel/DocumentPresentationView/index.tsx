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
import { asStudentGroupAccess } from '@tdev-models/helpers/accessPolicy';
import BadgeSelector from '@tdev-components/User/BadgeSelector';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import Card from '@tdev-components/shared/Card';

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
    const rootId = group.presentedDocument.documentRootId;
    const userPermissions = permissionStore.userPermissionsByDocumentRoot(rootId);
    const groupPermission = permissionStore
        .groupPermissionsByDocumentRoot(rootId)
        .find((p) => p.groupId === group.id)?.access;

    if (!group.adminIds.has(userStore.current?.id ?? ' ')) {
        return (
            <div className={clsx(styles.documentPresentationView)}>
                <CodeEditorComponent code={group.presentedDocument as iCode<CodeType>} isPresentation />
            </div>
        );
    }

    return (
        <Tabs className={clsx(styles.tabs)}>
            <TabItem value="presentation" label="Präsentation">
                <div className={clsx(styles.documentPresentationView)}>
                    <CodeEditorComponent code={group.presentedDocument as iCode<CodeType>} isPresentation />
                </div>
            </TabItem>
            <TabItem value="permissions" label="Berechtigungen">
                <Card classNames={{ body: clsx(styles.admin) }}>
                    <div className={clsx(styles.accessPanels)}>
                        <div className={clsx(styles.panel)}>
                            <b>Gruppe</b>
                            <GroupAccessSelector
                                group={group}
                                mark={asStudentGroupAccess(group.presentedDocument.root!.access)}
                            />
                        </div>
                        <div className={clsx(styles.panel)}>
                            <b>Geteilt</b>
                            <SharedAccessSelector
                                documentRoot={group.presentedDocument.root!}
                                maxAccess={groupPermission}
                            />
                        </div>
                    </div>
                    <div className={clsx(styles.studentSelector)}>
                        {group.students.map((s) => (
                            <BadgeSelector
                                user={s}
                                key={s.id}
                                onClick={async (user) => {
                                    const all = await Promise.all(
                                        userPermissions.map((p) => {
                                            return permissionStore.deleteUserPermission(p);
                                        })
                                    );
                                    await permissionStore.createUserPermission(rootId, user, Access.RW_User);
                                }}
                                selected={userPermissions.some((p) => p.userId === s.id)}
                            />
                        ))}
                    </div>
                </Card>
            </TabItem>
        </Tabs>
    );
});

export default DocumentPresentationView;
