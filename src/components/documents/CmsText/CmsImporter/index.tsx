import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import Popup from 'reactjs-popup';
import Button from '@tdev-components/shared/Button';
import { mdiCodeBlockBraces, mdiDatabaseImport, mdiFileExcel, mdiFileExcelOutline } from '@mdi/js';
import { useStore } from '@tdev-hooks/useStore';
import { DocumentType } from '@tdev-api/document';
import { CmsTextEntries } from '../WithCmsText';
import DocumentStore from '@tdev-stores/DocumentStore';
import CmsText from '@tdev-models/documents/CmsText';
import { Source } from '@tdev-models/iDocument';
import { ApiState } from '@tdev-stores/iStore';
import AssignColumns, { type AssignedColumn } from '@tdev-components/shared/AssignColumns';
import ImportPreview from './ImportPreview';
import XlsxImport from './XlsxImport';
import CodeImport from './CodeImport';
import { PopupActions } from 'reactjs-popup/dist/types';
import Badge from '@tdev-components/shared/Badge';

interface Props {
    className?: string;
    toAssign: CmsTextEntries;
    mode?: 'xlsx' | 'code';
}

const createCmsTexts = async (
    documentStore: DocumentStore,
    table: string[][],
    assignments: AssignedColumn[]
) => {
    const { documentRootStore } = documentStore.root;

    for (const assignment of assignments) {
        const documentRoot = documentRootStore.find(assignment.id);
        if (!documentRoot) {
            continue;
        }

        for (const row of table) {
            const userId = row[0];
            const doc = documentRoot.allDocuments.find((d) => d.isMain && d.authorId === userId) as CmsText;

            if (doc) {
                // update the document with the new text when needed
                if (doc.text !== row[assignment.idx]) {
                    doc.setData({ text: row[assignment.idx] }, Source.LOCAL);
                    await doc.saveNow();
                }
            } else {
                // create a new document with the text
                await documentStore.create({
                    type: 'cms_text',
                    authorId: userId,
                    documentRootId: assignment.id,
                    data: { text: row[assignment.idx] }
                });
            }
        }
    }
};

const CmsImporter = observer((props: Props) => {
    const { toAssign } = props;
    const ref = React.useRef<PopupActions>(null);
    const userStore = useStore('userStore');
    const documentStore = useStore('documentStore');
    const [mode, setMode] = React.useState<'xlsx' | 'code'>(props.mode || 'xlsx');
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
    if (!userStore.current?.hasElevatedAccess || userStore.isUserSwitched) {
        return null;
    }
    return (
        <Popup
            trigger={
                <span className={clsx(styles.importer, props.className)}>
                    <Button
                        onClick={(e) => e.preventDefault()}
                        icon={mdiDatabaseImport}
                        color={'blue'}
                        noOutline={isOpen}
                    />
                </span>
            }
            on="click"
            modal
            nested
            overlayStyle={{ background: 'rgba(0,0,0,0.5)' }}
            onOpen={() => {
                setIsOpen(true);
                documentStore
                    .apiLoadDocumentsFrom(Object.values(toAssign))
                    .then((models) => {
                        if (
                            documentStore.apiStateFor(`load-docs-${Object.values(toAssign).join('::')}`) ===
                            ApiState.SUCCESS
                        ) {
                            setReady(true);
                        } else {
                            console.log('Error loading documents');
                        }
                    })
                    .catch((err) => {
                        console.warn('Error loading documents', err);
                    });
            }}
            closeOnEscape={true}
            onClose={() => {
                setIsOpen(false);
                reset();
            }}
            ref={ref}
        >
            <div className={clsx(styles.wrapper, 'card')}>
                <div className={clsx('card__header', styles.header)}>
                    <h3>CMS Texte erstellen</h3>
                    <div className={clsx(styles.importLabels)}>
                        {Object.keys(toAssign).map((item, idx) => (
                            <Badge key={idx} type="primary" title={toAssign[item as keyof CmsTextEntries]}>
                                {item}
                            </Badge>
                        ))}
                    </div>
                </div>
                <div className={clsx('card__body', styles.cardBody)}>
                    {table.length === 0 ? (
                        <>
                            <div className={clsx('button-group', 'button-group--block')}>
                                <Button
                                    icon={mdiFileExcel}
                                    text={'Excel'}
                                    onClick={() => {
                                        setMode('xlsx');
                                    }}
                                    active={mode === 'xlsx'}
                                    color="green"
                                />
                                <Button
                                    icon={mdiCodeBlockBraces}
                                    text={'Code'}
                                    onClick={() => {
                                        setMode('code');
                                    }}
                                    active={mode === 'code'}
                                    color="blue"
                                />
                            </div>
                            {mode === 'xlsx' ? (
                                <XlsxImport
                                    onDone={(data) => {
                                        setTable(data);
                                    }}
                                    onClose={closeTooltip}
                                />
                            ) : (
                                <CodeImport
                                    onDone={(data) => {
                                        setTable(data);
                                    }}
                                    onClose={closeTooltip}
                                />
                            )}
                        </>
                    ) : (
                        <>
                            <AssignColumns
                                onChange={(assigned) => {
                                    setAssigned(assigned);
                                }}
                                table={table}
                                toAssign={toAssign}
                                trimmedCells={{ [0]: 7 }}
                                tableClassName={clsx(styles.assignTable)}
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

export default CmsImporter;
