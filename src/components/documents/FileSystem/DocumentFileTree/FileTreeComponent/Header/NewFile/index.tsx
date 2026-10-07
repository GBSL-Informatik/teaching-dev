import { mdiFilePlus } from '@mdi/js';
import { DocumentType } from '@tdev-api/document';
import Alert from '@tdev-components/shared/Alert';
import Button from '@tdev-components/shared/Button';
import Card from '@tdev-components/shared/Card';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import { useDocument } from '@tdev-hooks/useContextDocument';
import { useStore } from '@tdev-hooks/useStore';
import { FileConfig } from '@tdev-stores/DocumentStore';
import { orderBy } from 'es-toolkit';
import { observer } from 'mobx-react-lite';
import React from 'react';
import Popup from 'reactjs-popup';
import { useFileTreeModel } from '../../../hooks/useFileTreeModel';
import { getFocusedDirectory } from '../../actions/getFocusedDirectory';
import { syncFileTree } from '../../actions/syncFileTree';
import styles from './styles.module.scss';

const NewFile = observer(() => {
    const documentStore = useStore('documentStore');
    const model = useFileTreeModel();
    const root = useDocument<'dir'>();
    const [docType, setDocType] = React.useState<FileConfig<DocumentType> | null>(null);
    const [pending, setPending] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const fileTypes = orderBy(
        [...documentStore.fileExtensions.entries()].flatMap(([type, configs]) => {
            return configs.filter((c) => !c.hide).map((config) => ({ type, config }));
        }),
        [(c) => c.config.priority],
        ['asc']
    );

    const createFile = async (type: DocumentType, config: FileConfig<DocumentType>) => {
        const dir = getFocusedDirectory(model, root);
        if (pending || !dir) {
            return;
        }
        setPending(true);
        setError(null);
        try {
            const newFile = await dir.createFile(type, `new-file${config.extension}`);
            if (newFile) {
                syncFileTree(model, root);
                model.startRenaming(newFile.filePath);
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Die Datei konnte nicht erstellt werden.');
        } finally {
            setPending(false);
        }
    };

    return (
        <Popup
            trigger={
                <span>
                    <Button icon={mdiFilePlus} title="Neue Datei" size={SIZE_S} noBorder color="grey" />
                </span>
            }
            on={['hover', 'click']}
            position={['bottom right', 'bottom center', 'bottom left']}
            arrow={false}
        >
            <Card classNames={{ body: styles.newFile }}>
                <div className={styles.select}>
                    {fileTypes.map((item) => {
                        const { type, config } = item;
                        return (
                            <div key={config.extension} onMouseEnter={() => setDocType(config)}>
                                <Button
                                    title={config.extension || type}
                                    {...(config.icon
                                        ? { icon: config.icon }
                                        : { text: config.extension || type })}
                                    color={config.iconColor}
                                    size={SIZE_S}
                                    iconSide="left"
                                    disabled={pending}
                                    onClick={() => createFile(type, config)}
                                />
                            </div>
                        );
                    })}
                </div>
                {error && <Alert type="danger">{error}</Alert>}
                {docType && (
                    <i>
                        {docType.name} (
                        <small>
                            <code>{docType.extension}</code>
                        </small>
                        )
                        <br />
                        <small>{docType.description}</small>
                    </i>
                )}
            </Card>
        </Popup>
    );
});

export default NewFile;
