import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import Button from '@tdev-components/shared/Button';
import Badge from '@tdev-components/shared/Badge';
import Link from '@docusaurus/Link';
import CopyBadge from '@tdev-components/shared/CopyBadge';
import { reaction } from 'mobx';
import { AccessColor, AccessIcon } from '@tdev-components/PermissionsPanel/AccessBadge';
import Icon from '@mdi/react';
import { SIZE_XS } from '@tdev-components/shared/iconSizes';
import {
    mdiAccount,
    mdiAccountGroup,
    mdiFileMultipleOutline,
    mdiShareVariantOutline,
    mdiSync
} from '@mdi/js';
import { ApiState } from '@tdev-stores/iStore';
import Card from '@tdev-components/shared/Card';
import DocumentTypeSelector from './DocumentTypeSelector';
import TextInput from '@tdev-components/shared/TextInput';
import PermissionsPanel from '@tdev-components/PermissionsPanel';
import PageActions from './PageActions';
import AccessOverview from './AccessOverview';

interface Props {}

const PermissionsControl = observer((props: Props) => {
    const docRootStore = useStore('documentRootStore');
    const permissionStore = useStore('permissionStore');
    const viewStore = useStore('viewStore');
    const view = viewStore.permissionControl;

    React.useEffect(() => {
        const loadDocRoots = (ids: string[]) => {
            permissionStore.loadAllPermissions(ids).catch((err) => {
                console.error('Error loading permissions:', err);
            });
        };
        loadDocRoots(view.relevantDocumentRootIds);
        const dispose = reaction(
            () => view.relevantDocumentRootIds,
            (relevantDocumentRootIds) => {
                loadDocRoots(relevantDocumentRootIds);
            }
        );
        return () => {
            dispose();
        };
    }, []);

    return (
        <div className={clsx(styles.adminPermission)}>
            <Card header={<h3>Filter</h3>} classNames={{ card: clsx(styles.actions) }}>
                <DocumentTypeSelector />
                <Button
                    icon={mdiSync}
                    color="orange"
                    noOutline
                    onClick={() => {
                        permissionStore
                            .loadAllPermissions(view.relevantDocumentRootIds, true)
                            .catch((err) => {
                                console.error('Error loading permissions:', err);
                            });
                    }}
                    text="Berechtigungen neu laden"
                    spin={permissionStore.apiStateFor('load-all-permissions') === ApiState.SYNCING}
                />
                <TextInput
                    label="Pfad filtern"
                    value={view.pathFilter}
                    onChange={(value) => view.setPathFilter(value)}
                />
            </Card>
            <Card header={<h3>Berechtigungen</h3>} classNames={{ card: clsx(styles.docsTree) }}>
                <ul>
                    {Object.entries(view.docsTree).map(([path, docs]) => (
                        <li key={path}>
                            <div className={clsx(styles.pathHeader)}>
                                <strong>
                                    <Link to={path}>{path}</Link>
                                </strong>
                                <PermissionsPanel
                                    documentRootIds={docs.map((doc) => doc.id)}
                                    color="warning"
                                />
                            </div>
                            <PageActions docs={docs} />
                            <ul>
                                {docs.map((doc) => {
                                    return (
                                        <li key={doc.id} className={clsx(styles.docItem)}>
                                            <div className={clsx(styles.docRoot)}>
                                                <AccessOverview doc={doc} />
                                                <PermissionsPanel documentRootId={doc.id} />
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </li>
                    ))}
                </ul>
            </Card>
        </div>
    );
});

export default PermissionsControl;
