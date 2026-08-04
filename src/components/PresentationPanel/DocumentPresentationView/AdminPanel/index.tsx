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
import {
    mdiCloudCheckVariantOutline,
    mdiCloudOffOutline,
    mdiCloudTags,
    mdiEye,
    mdiEyeLock,
    mdiEyeLockOpen,
    mdiMagnify,
    mdiMagnifyScan
} from '@mdi/js';
import FocusSelector from './FocusSelector';
import SpinningWheel from './SpinningWheel';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import useIsMobileView from '@tdev-hooks/useIsMobileView';
import DefinitionList from '@tdev-components/DefinitionList';
import Icon from '@mdi/react';
import { SIZE_S } from '@tdev-components/shared/iconSizes';

interface Props {
    group: StudentGroup;
}

const AdminPanel = observer((props: Props) => {
    const permissionStore = useStore('permissionStore');
    const viewStore = useStore('viewStore');
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
                <TabItem value="settings" label="Einstellungen">
                    <DefinitionList>
                        <dt>
                            <Icon path={mdiEye} size={SIZE_S} color="var(--ifm-color-primary)" />
                        </dt>
                        <dd>
                            <Button
                                onClick={() => {
                                    group.setPresentingUsersVisibility(
                                        !!group.presentedDocumentProps?.hidePresentingUsers
                                    );
                                }}
                                color={group.presentedDocumentProps?.hidePresentingUsers ? 'red' : 'green'}
                                text={group.presentedDocumentProps?.hidePresentingUsers ? 'Nein' : 'Ja'}
                                iconSide="left"
                                icon={
                                    group.presentedDocumentProps?.hidePresentingUsers
                                        ? mdiEyeLock
                                        : mdiEyeLockOpen
                                }
                            />
                        </dd>
                        <dd>Namen der präsentierten User anzeigen?</dd>
                        <dt>
                            <Icon path={mdiCloudTags} size={SIZE_S} color="var(--ifm-color-primary)" />
                        </dt>
                        <dd>
                            <Button
                                onClick={() => {
                                    group.setPresentedDocumentRemoteExecutionPolicy(
                                        !group.isRemoteExecutionAllowed
                                    );
                                }}
                                color={group.isRemoteExecutionAllowed ? 'green' : 'red'}
                                text={group.isRemoteExecutionAllowed ? 'Ja' : 'Nein'}
                                iconSide="left"
                                icon={
                                    group.isRemoteExecutionAllowed
                                        ? mdiCloudCheckVariantOutline
                                        : mdiCloudOffOutline
                                }
                            />
                        </dd>
                        <dd>Remote-Execution aktivieren?</dd>
                        <dt>
                            <Icon path={mdiMagnifyScan} size={SIZE_S} color="var(--ifm-color-primary)" />
                        </dt>
                        <dd>
                            <Button
                                onClick={() => {
                                    viewStore.setIsPresentedEditorZoomed(!viewStore.isPresentedEditorZoomed);
                                }}
                                color={viewStore.isPresentedEditorZoomed ? 'green' : 'red'}
                                text={viewStore.isPresentedEditorZoomed ? 'Ja' : 'Nein'}
                                iconSide="left"
                                icon={viewStore.isPresentedEditorZoomed ? mdiMagnifyScan : mdiMagnify}
                            />
                        </dd>
                        <dd>Editor Schriftart vergrössern? (120%)</dd>
                    </DefinitionList>
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
                </TabItem>
            </Tabs>
        </Card>
    );
});

export default AdminPanel;
