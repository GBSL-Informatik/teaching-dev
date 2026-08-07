import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import siteConfig from '@generated/docusaurus.config';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import Button from '@tdev-components/shared/Button';
import Link from '@docusaurus/Link';
import { reaction } from 'mobx';
import { mdiSync } from '@mdi/js';
import { ApiState } from '@tdev-stores/iStore';
import Card from '@tdev-components/shared/Card';
import DocumentTypeSelector from './DocumentTypeSelector';
import TextInput from '@tdev-components/shared/TextInput';
import PermissionsPanel from '@tdev-components/PermissionsPanel';
import PageActions from './PageActions';
import AccessOverview from './AccessOverview';
import Badge from '@tdev-components/shared/Badge';
import type * as Preset from '@docusaurus/preset-classic';

const { presets } = siteConfig;
const classicPreset = (
    presets.find((p) => Array.isArray(p) && p[0] === 'classic') as [string, Preset.Options] | undefined
)?.[1];
const docsBasePath = classicPreset?.docs ? (classicPreset.docs.routeBasePath ?? '/docs/') : '/docs/';
const extractDocsPath = (path: string) => {
    if (docsBasePath !== '/') {
        return path;
    }
    if (path.startsWith('/docs/')) {
        return path.replace('/docs/', '/');
    }
    return path;
};

interface Props {}

const PermissionsControl = observer((props: Props) => {
    const permissionStore = useStore('permissionStore');
    const documentRootStore = useStore('documentRootStore');
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
            documentRootStore.abortRequest('load-document-roots');
            documentRootStore.cleanupUnknownDocumentRoots();
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

                <Badge color="blue">
                    Angezeigte <i>DocumentRoots</i>: {view.filteredDocumentRoots} / {view.totalDocumentRoots}
                </Badge>
            </Card>
            <Card header={<h3>Berechtigungen</h3>} classNames={{ card: clsx(styles.docsTree) }}>
                <ul>
                    {Object.entries(view.docsTree).map(([path, docs]) => (
                        <li key={path} className={clsx(styles.pathItem)}>
                            <div className={clsx(styles.page)}>
                                <div className={clsx(styles.pathHeader)}>
                                    <strong>
                                        <Link to={extractDocsPath(path)}>{path}</Link>
                                    </strong>
                                    <div className={clsx(styles.pathActions)}>
                                        <Badge color="blue">{docs.length}</Badge>
                                        <PermissionsPanel
                                            documentRootIds={docs.map((doc) => doc.id)}
                                            color="warning"
                                        />
                                    </div>
                                </div>
                                <PageActions docs={docs} />
                            </div>
                            <ul>
                                {docs.map((doc) => {
                                    return (
                                        <li key={doc.id} className={clsx(styles.docItem)}>
                                            <div className={clsx(styles.docRoot)}>
                                                <AccessOverview doc={doc} />
                                                <PermissionsPanel
                                                    documentRootId={doc.id}
                                                    className={clsx(styles.permissionButton)}
                                                />
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
