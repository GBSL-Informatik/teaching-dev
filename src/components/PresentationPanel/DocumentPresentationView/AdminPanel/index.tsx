import React from 'react';
import clsx from 'clsx';
import styles from '../styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import StudentGroup from '@tdev-models/StudentGroup';
import GroupAccessSelector from '@tdev-components/PermissionsPanel/AccessSelector/GroupAccessSelector';
import SharedAccessSelector from '@tdev-components/PermissionsPanel/AccessSelector/SharedAccessSelector';
import { asStudentGroupAccess } from '@tdev-models/helpers/accessPolicy';
import Card from '@tdev-components/shared/Card';
import Badge from '@tdev-components/shared/Badge';
import RootAccessSelector from '@tdev-components/PermissionsPanel/AccessSelector/RootAccessSelector';
import Alert from '@tdev-components/shared/Alert';
import Button from '@tdev-components/shared/Button';
import { mdiEyeLock, mdiEyeLockOpen } from '@mdi/js';
import Details from '@theme/Details';
import FocusSelector from './FocusSelector';
import SpinningWheel from './SpinningWheel';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import useIsMobileView from '@tdev-hooks/useIsMobileView';

interface Props {
    group: StudentGroup;
}

const AdminPanel = observer((props: Props) => {
    const permissionStore = useStore('permissionStore');
    const isMobile = useIsMobileView(450);
    const { group } = props;
    if (!group.presentedDocument) {
        return <Alert type="warning">{group.name} hat keine aktive Präsentation</Alert>;
    }
    const rootId = group.presentedDocument.documentRootId;
    const groupPermission = permissionStore
        .groupPermissionsByDocumentRoot(rootId)
        .find((p) => p.groupId === group.id)?.access;

    return (
        <Card
            header={
                <h2>
                    <Badge color="blue">{group.name}</Badge>
                </h2>
            }
            classNames={{ card: clsx(styles.adminCard), body: clsx(styles.admin) }}
        >
            <Tabs className={clsx(styles.tabs)} lazy>
                <TabItem value="spinningWheel" label="Zufall" className={clsx(styles.centered)}>
                    <SpinningWheel group={group} size={isMobile ? 200 : 380} />
                </TabItem>
                <TabItem value="focus" label="Fokus">
                    <FocusSelector group={group} />
                </TabItem>
            </Tabs>
            <Details summary="Einstellungen">
                <div className={clsx(styles.accessPanels)}>
                    <div className={clsx(styles.panel)}>
                        <b>Namen der präsentierten Nutzer anzeigen?</b>
                        <Button
                            onClick={() => {
                                group.setPresentingUsersVisibility(
                                    !!group.presentedDocumentProps?.hidePresentingUsers
                                );
                            }}
                            color={group.presentedDocumentProps?.hidePresentingUsers ? 'red' : 'green'}
                            icon={
                                group.presentedDocumentProps?.hidePresentingUsers
                                    ? mdiEyeLock
                                    : mdiEyeLockOpen
                            }
                        />
                    </div>
                </div>
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
            </Details>
        </Card>
    );
});

export default AdminPanel;
