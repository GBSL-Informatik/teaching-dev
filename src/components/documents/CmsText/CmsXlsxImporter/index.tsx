import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import Popup from 'reactjs-popup';
import Button from '@tdev-components/shared/Button';
import FromXlsxClipboard from '@tdev-components/shared/FromXlsxClipboard';
import { mdiClose, mdiFileExcelOutline } from '@mdi/js';
import { useStore } from '@tdev-hooks/useStore';
import { DocumentType } from '@tdev-api/document';
import { CmsTextEntries } from '../WithCmsText';
import DocumentStore from '@tdev-stores/DocumentStore';
import CmsText from '@tdev-models/documents/CmsText';
import { Source } from '@tdev-models/iDocument';
import { ApiState } from '@tdev-stores/iStore';
import AssignColumns, { type AssignedColumn } from '@tdev-components/shared/FromXlsxClipboard/AssignColumns';
import ImportPreview from './ImportPreview';

interface Props {
    className?: string;
    toAssign: CmsTextEntries;
}

const createCmsTexts = (documentStore: DocumentStore, table: string[][], assignments: AssignedColumn[]) => {
    const { documentRootStore } = documentStore.root;

    const promises = assignments.flatMap((assignment) => {
        const documentRoot = documentRootStore.find(assignment.id);
        if (!documentRoot) {
            return Promise.resolve();
        }
        return table.flatMap((row) => {
            const userId = row[0];
            const doc = documentRoot.allDocuments.find((d) => d.isMain && d.authorId === userId) as CmsText;
            if (doc) {
                // update the document with the new text when needed
                if (doc.text === row[assignment.idx]) {
                    return Promise.resolve();
                }
                doc.setData({ text: row[assignment.idx] }, Source.LOCAL);
                return doc.saveNow();
            }
            // create a new document with the text
            return documentStore.create({
                type: DocumentType.CmsText,
                authorId: userId,
                documentRootId: assignment.id,
                data: { text: row[assignment.idx] }
            });
        });
    });
    return Promise.all(promises);
};

const CmsXlsxImporter = observer((props: Props) => {
    const { toAssign } = props;
    const ref = React.useRef(null);
    const userStore = useStore('userStore');
    const documentStore = useStore('documentStore');
    const [table, setTable] = React.useState<string[][]>([]);
    const [assigned, setAssigned] = React.useState<AssignedColumn[]>([]);
    const [ready, setReady] = React.useState(false);
    const [isOpen, setIsOpen] = React.useState(false);
    const reset = () => {
        setTable([]);
        setAssigned([]);
    };
    const closeTooltip = () => {
        (ref.current as any)?.close();
    };
    if (!userStore.current?.isAdmin || userStore.isUserSwitched) {
        return null;
    }
    return (
        <Popup
            trigger={
                <span className={clsx(styles.importer, props.className)}>
                    <Button
                        onClick={(e) => e.preventDefault()}
                        icon={mdiFileExcelOutline}
                        color={'green'}
                        noOutline={isOpen}
                    />
                </span>
            }
            on="click"
            modal
            overlayStyle={{ background: 'rgba(0,0,0,0.5)' }}
            onOpen={() => {
                setIsOpen(true);
                documentStore.apiLoadDocumentsFrom(Object.values(toAssign)).then((models) => {
                    if (
                        documentStore.apiStateFor(`load-docs-${Object.values(toAssign).join('::')}`) ===
                        ApiState.SUCCESS
                    ) {
                        setReady(true);
                    } else {
                        console.log('Error loading documents');
                    }
                });
            }}
            closeOnEscape={false}
            onClose={() => {
                setIsOpen(false);
                reset();
            }}
            ref={ref}
        >
            <div className={clsx(styles.wrapper, 'card')}>
                <div className={clsx('card__header', styles.header)}>
                    <h3>CMS Texte erstellen</h3>
                </div>
                <div className={clsx('card__body', styles.cardBody)}>
                    {table.length === 0 ? (
                        <FromXlsxClipboard
                            matchUsers
                            onDone={(table) => {
                                const newTable = table?.filter(
                                    (row) => row.length > 0 && row[0].trim().length > 0
                                );
                                /**
                                 * table includes header
                                 */
                                if (!newTable || newTable.length <= 1) {
                                    return closeTooltip();
                                }
                                setTable(newTable);
                            }}
                            importLabel="Weiter"
                            cancelIcon={mdiClose}
                            includeHeader
                        />
                    ) : (
                        <>
                            <AssignColumns
                                onChange={(assigned) => {
                                    setAssigned(assigned);
                                }}
                                table={table}
                                toAssign={toAssign}
                                trimmedCells={{ [0]: 7 }}
                            />
                            <ImportPreview tableWithHeader={table} assignments={assigned} />
                        </>
                    )}
                </div>
                {table.length > 0 && (
                    <div className="card__footer">
                        <div className={clsx('button-group', 'button-group--block')}>
                            <Button
                                text={'Abbrechen'}
                                onClick={() => {
                                    closeTooltip();
                                }}
                                color="black"
                            />
                            <Button
                                text={'CMS Texte erstellen'}
                                onClick={() => {
                                    createCmsTexts(documentStore, table.slice(1), assigned)
                                        .then(() => {
                                            closeTooltip();
                                        })
                                        .catch((e) => {
                                            console.error(e);
                                        });
                                }}
                                color="primary"
                                disabled={assigned.length === 0 || !ready}
                                spin={!ready}
                            />
                        </div>
                    </div>
                )}
            </div>
        </Popup>
    );
});

export default CmsXlsxImporter;
