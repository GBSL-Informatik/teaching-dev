import { mdiCodeBlockBraces, mdiDatabaseImport, mdiFileExcel, mdiLoading, mdiPencil } from '@mdi/js';
import Loader from '@tdev-components/Loader';
import AssignColumns, { type AssignedColumn } from '@tdev-components/shared/AssignColumns';
import Button from '@tdev-components/shared/Button';
import CopyBadge from '@tdev-components/shared/CopyBadge';
import { useStore } from '@tdev-hooks/useStore';
import { createCmsText, findMainCmsText } from '@tdev-models/documents/CmsText';
import { Source } from '@tdev-models/iDocument';
import DocumentStore from '@tdev-stores/DocumentStore';
import { ApiState } from '@tdev-stores/iStore';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import Popup from 'reactjs-popup';
import { PopupActions } from 'reactjs-popup/dist/types';
import { CmsTextEntries } from '../WithCmsText';
import CmsTextEditor from './CmsTextEditor';
import CodeImport from './CodeImport';
import ImportPreview from './ImportPreview';
import styles from './styles.module.scss';
import XlsxImport from './XlsxImport';

interface Props {
    className?: string;
    toAssign: CmsTextEntries;
    mode?: 'xlsx' | 'code';
}

/**
 * Updates the user's main cms text of the document root or creates it, when it does not exist yet.
 * @returns whether the text was saved successfully
 */
const saveCmsText = async (
    documentStore: DocumentStore,
    documentRootId: string,
    userId: string,
    text: string
): Promise<boolean> => {
    const doc = findMainCmsText(documentStore, documentRootId, userId);
    if (!doc) {
        return createCmsText(documentStore, documentRootId, userId, text);
    }
    doc.discardDraft();
    const isAlreadySaved = doc.text === text && !doc.isDirty;
    if (isAlreadySaved) {
        return true;
    }
    doc.setData({ text: text }, Source.LOCAL);
    return !!(await doc.saveNow());
};

const createCmsTexts = async (
    documentStore: DocumentStore,
    table: string[][],
    assignments: AssignedColumn[]
) => {
    for (const assignment of assignments) {
        for (const row of table) {
            const userId = row[0];
            await saveCmsText(documentStore, assignment.id, userId, row[assignment.idx]);
        }
    }
};

const CmsImporter = observer((props: Props) => {
    const { toAssign } = props;
    const cmsAssignments = React.useMemo(() => {
        return Object.entries(toAssign).reduce(
            (acc, val) => {
                acc[val[1]] = [val[0]];
                return acc;
            },
            {} as Record<string, string[]>
        );
    }, [toAssign]);
    const ref = React.useRef<PopupActions>(null);
    const userStore = useStore('userStore');
    const documentStore = useStore('documentStore');
    const [mode, setMode] = React.useState<'xlsx' | 'code' | 'edit'>(props.mode || 'xlsx');
    const [table, setTable] = React.useState<string[][]>([]);
    const [assigned, setAssigned] = React.useState<AssignedColumn[]>([]);
    const [ready, setReady] = React.useState(false);
    const [isImporting, setIsImporting] = React.useState(false);
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
                const docRootIds = Object.keys(cmsAssignments);
                documentStore
                    .apiLoadDocumentsFrom(docRootIds)
                    .then((models) => {
                        if (
                            documentStore.apiStateFor(`load-docs-${docRootIds.join('::')}`) ===
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
                        {Object.keys(cmsAssignments).map((id) => (
                            <CopyBadge
                                key={id}
                                value={id}
                                label={cmsAssignments[id][0] ?? id}
                                title={`documentRootId kopieren: ${id}`}
                                color="blue"
                            />
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
                                <Button
                                    icon={mdiPencil}
                                    text={'Bearbeiten'}
                                    onClick={() => {
                                        setMode('edit');
                                    }}
                                    active={mode === 'edit'}
                                    color="orange"
                                />
                            </div>
                            {mode === 'edit' &&
                                (ready ? <CmsTextEditor cmsAssignments={cmsAssignments} /> : <Loader />)}
                            {mode === 'xlsx' && (
                                <XlsxImport
                                    onDone={(data) => {
                                        setTable(data);
                                    }}
                                    onClose={closeTooltip}
                                />
                            )}
                            {mode === 'code' && (
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
                                toAssign={cmsAssignments}
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
                                    setIsImporting(true);
                                    createCmsTexts(documentStore, table.slice(1), assigned)
                                        .then(() => {
                                            closeTooltip();
                                        })
                                        .catch((e) => {
                                            console.error(e);
                                        })
                                        .finally(() => {
                                            setIsImporting(false);
                                        });
                                }}
                                color="primary"
                                disabled={assigned.length === 0 || !ready || isImporting}
                                icon={!ready || isImporting ? mdiLoading : undefined}
                                spin={!ready || isImporting}
                            />
                        </div>
                    </div>
                )}
            </div>
        </Popup>
    );
});

export default CmsImporter;
