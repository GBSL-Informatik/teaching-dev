import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import StudentGroup from '@tdev-models/StudentGroup';
import { Access, CodeType } from '@tdev-api/document';
import CodeEditorComponent from '@tdev-components/documents/CodeEditor';
import iCode from '@tdev-models/documents/iCode';
import GroupAccessSelector from '@tdev-components/PermissionsPanel/AccessSelector/GroupAccessSelector';
import SharedAccessSelector from '@tdev-components/PermissionsPanel/AccessSelector/SharedAccessSelector';
import { asStudentGroupAccess } from '@tdev-models/helpers/accessPolicy';
import BadgeSelector from '@tdev-components/User/BadgeSelector';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import Card from '@tdev-components/shared/Card';
import Badge from '@tdev-components/shared/Badge';
import Button from '@tdev-components/shared/Button';
import { mdiEye, mdiMovieOpenPlay, mdiProjectorScreenOffOutline } from '@mdi/js';
import RootAccessSelector from '@tdev-components/PermissionsPanel/AccessSelector/RootAccessSelector';
import Icon from '@mdi/react';
import { SIZE_XS } from '@tdev-components/shared/iconSizes';

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
    const groupPermission = permissionStore
        .groupPermissionsByDocumentRoot(rootId)
        .find((p) => p.groupId === group.id)?.access;

    if (!group.adminIds.has(userStore.current?.id ?? ' ')) {
        return (
            <div className={clsx(styles.documentPresentationView)}>
                {group.presentedDocument.canEdit ? (
                    <Badge color="orange">
                        Live <Icon path={mdiMovieOpenPlay} size={SIZE_XS} />
                    </Badge>
                ) : (
                    <Badge color="lightBlue">
                        <Icon path={mdiEye} size={SIZE_XS} />
                    </Badge>
                )}
                <CodeEditorComponent code={group.presentedDocument as iCode<CodeType>} isPresentation />
            </div>
        );
    }

    return (
        <div className={clsx(styles.presentationView)}>
            <Tabs className={clsx(styles.tabs)}>
                <TabItem value="presentation" label="Präsentation">
                    <div className={clsx(styles.documentPresentationView)}>
                        <CodeEditorComponent
                            code={group.presentedDocument as iCode<CodeType>}
                            isPresentation
                        />
                    </div>
                </TabItem>
                <TabItem value="permissions" label="Berechtigungen">
                    <Card classNames={{ card: clsx(styles.adminCard), body: clsx(styles.admin) }}>
                        <h3>
                            Gruppe <Badge color="blue">{group.name}</Badge>
                        </h3>
                        <h3>Berechtigungen</h3>
                        <div className={clsx(styles.accessPanels)}>
                            <div className={clsx(styles.panel)}>
                                <b>Gruppe</b>
                                <GroupAccessSelector
                                    group={group}
                                    mark={asStudentGroupAccess(group.presentedDocument.root!.access)}
                                />
                            </div>
                            <div>
                                <div className={clsx(styles.panel)}>
                                    <b style={{ width: '3.5em' }}>Root</b>
                                    <RootAccessSelector documentRoot={group.presentedDocument.root!} />
                                </div>
                                <div className={clsx(styles.panel)}>
                                    <b style={{ width: '3.5em' }}>Geteilt</b>
                                    <SharedAccessSelector
                                        documentRoot={group.presentedDocument.root!}
                                        maxAccess={groupPermission}
                                    />
                                </div>
                            </div>
                        </div>
                        <h3>Fokus</h3>
                        <div className={clsx(styles.studentSelector)}>
                            {group.users.map((s) => (
                                <BadgeSelector
                                    user={s}
                                    key={s.id}
                                    onClick={async (user, clearCurrent) => {
                                        if (clearCurrent) {
                                            await Promise.all(
                                                permissionStore
                                                    .userPermissionsByDocumentRoot(rootId)
                                                    .filter(
                                                        (u) =>
                                                            group.userIds.has(u.userId) &&
                                                            !group.adminIds.has(u.userId)
                                                    )
                                                    .map((p) => {
                                                        return permissionStore.deleteUserPermission(p);
                                                    })
                                            );
                                        }
                                        const currentPermission = permissionStore
                                            .userPermissionsByDocumentRoot(rootId)
                                            .find((p) => p.userId === user.id);
                                        if (currentPermission) {
                                            await permissionStore.deleteUserPermission(currentPermission);
                                        } else {
                                            await permissionStore.createUserPermission(
                                                rootId,
                                                user,
                                                Access.RW_User
                                            );
                                        }
                                    }}
                                    selected={permissionStore
                                        .userPermissionsByDocumentRoot(rootId)
                                        .some((p) => p.userId === s.id)}
                                />
                            ))}
                        </div>
                    </Card>
                </TabItem>
            </Tabs>
            <Button
                className={clsx(styles.closePresentationButton)}
                icon={mdiProjectorScreenOffOutline}
                noOutline
                onClick={() => group.apiSetPresentedDocumentProps(null)}
            />
        </div>
    );
});

export default DocumentPresentationView;
