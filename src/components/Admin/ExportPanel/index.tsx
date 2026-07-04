import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import Button from '@tdev-components/shared/Button';
import { mdiClose, mdiDatabaseExport, mdiLoading } from '@mdi/js';
import Card from '@tdev-components/shared/Card';
import { DocumentType } from '@tdev-api/document';
import { ApiState } from '@tdev-stores/iStore';
import {} from 'es-toolkit/array';
import { SIZE_S } from '@tdev-components/shared/iconSizes';

export interface Props {
    name?: string;
    fileName?: string;
    userIds: string[];
    onClose?: () => void;
}

const ExportPanel = observer((props: Props) => {
    const { userIds, fileName } = props;
    const adminStore = useStore('adminStore');
    const documentStore = useStore('documentStore');
    const documentTypes = [...documentStore.documentTypes].sort();
    const [ignored, setIgnored] = React.useState<Set<DocumentType>>(new Set(['script_version']));
    const isExporting =
        adminStore.apiStateFor(`request-user-data-export-${userIds.join('-')}`) === ApiState.SYNCING;

    return (
        <Card
            classNames={{ card: clsx(styles.exportPanel) }}
            header={
                <div className={clsx(styles.header)}>
                    <h3>Export {props.name || 'User Data'}</h3>
                    <Button
                        icon={mdiClose}
                        size={SIZE_S}
                        onClick={() => {
                            props.onClose?.();
                        }}
                    />
                </div>
            }
            footer={
                <>
                    <Button
                        icon={isExporting ? mdiLoading : mdiDatabaseExport}
                        spin={isExporting}
                        iconSide="left"
                        text="Exportieren"
                        onClick={async () => {
                            const { data } = await adminStore.requestUserDataExport(userIds, [...ignored]);
                            const toExport = data.length > 1 ? data : data[0];
                            // download the data as JSON file
                            const blob = new Blob([JSON.stringify(toExport, null, 2)], {
                                type: 'application/json'
                            });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download =
                                fileName || `user_data_export_${new Date().toISOString().slice(0, 10)}.json`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                            props.onClose?.();
                        }}
                        className="button--block"
                    />
                </>
            }
        >
            <h4>Ignorierte Dokument-Typen</h4>
            <small>
                Sollen nicht alle Dokument-Typen exportiert werden, können hier die zu ignorierenden Typen
                ausgewählt werden. Standardmässig wird der Dokument-Typ <code>script_version</code> ignoriert,
                da dieser für die meisten Anwendungsfälle nicht relevant ist.
            </small>
            <div className={clsx(styles.ignoredDocumentTypes)}>
                <Button
                    text={ignored.size > 0 ? 'Keine ignorieren' : 'Alle ignorieren'}
                    onClick={() => {
                        if (ignored.size > 0) {
                            setIgnored(new Set());
                        } else {
                            setIgnored(new Set(documentTypes));
                        }
                    }}
                />
                <div className={clsx(styles.docTypes, 'button-group', 'button--block')}>
                    {documentTypes.map((docType, idx) => (
                        <Button
                            className={clsx(styles.docTypeButton)}
                            onClick={() => {
                                const newIgnored = new Set(ignored);
                                if (newIgnored.has(docType)) {
                                    newIgnored.delete(docType);
                                } else {
                                    newIgnored.add(docType);
                                }
                                setIgnored(newIgnored);
                            }}
                            text={docType}
                            color={ignored.has(docType) ? 'red' : 'primary'}
                            key={idx}
                        />
                    ))}
                </div>
            </div>
        </Card>
    );
});

export default ExportPanel;
