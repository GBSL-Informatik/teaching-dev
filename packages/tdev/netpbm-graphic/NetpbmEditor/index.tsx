import { observer } from 'mobx-react-lite';
import styles from './styles.module.scss';
import React from 'react';
import clsx from 'clsx';
import ImageCanvas from './ImageCanvas';
import NetpbmGraphic from '@tdev/netpbm-graphic/model/index';
import { useFirstMainDocument } from '@tdev-hooks/useFirstMainDocument';
import { Source } from '@tdev-models/iDocument';
import SyncStatus from '@tdev-components/SyncStatus';
import Icon from '@mdi/react';
import {
    mdiAlertCircle,
    mdiAlertCircleOutline,
    mdiCheckAll,
    mdiFlashTriangle,
    mdiFormatTextRotationAngleUp,
    mdiTextBoxCheckOutline
} from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import { ApiState } from '@tdev-stores/iStore';
import { MetaInit, ModelMeta } from '../model/ModelMeta';
import UnknownDocumentType from '@tdev-components/shared/Alert/UnknownDocumentType';

const StateIcons = observer(({ doc }: { doc: NetpbmGraphic }) => (
    <span className={clsx(styles.stateIcons)}>
        <SyncStatus model={doc} size={0.7} />
        {doc.root?.isDummy && (
            <Icon path={mdiFlashTriangle} size={0.7} color="orange" title="Wird nicht gespeichert." />
        )}
    </span>
));

interface Props extends MetaInit {
    id: string;
    noEditor?: boolean;
    hideWarning?: boolean;
}

const NetpbmEditor = observer((props: Props) => {
    const [meta] = React.useState(new ModelMeta(props));
    const doc = useFirstMainDocument(props.id, meta);
    const ref = React.useRef<HTMLTextAreaElement>(null);
    React.useEffect(() => {
        if (!ref.current) {
            return;
        }
        const handleWheel = (e: WheelEvent) => {
            if (e.ctrlKey) {
                const textarea = e.target as HTMLTextAreaElement;
                if (!textarea) {
                    return;
                }
                e.preventDefault();
                const currentSize = parseFloat(window.getComputedStyle(textarea).fontSize);
                const newSize = e.deltaY < 0 ? currentSize * 1.1 : currentSize * 0.9;
                textarea.style.fontSize = `${newSize}px`;
            }
        };

        ref.current.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            ref.current?.removeEventListener('wheel', handleWheel);
        };
    }, []);

    if (!doc) {
        return <UnknownDocumentType type={meta.type} />;
    }

    return (
        <div className={clsx(styles.netpbm)}>
            <div className={clsx(styles.editor, { [styles.hidden]: props.noEditor })}>
                <div className={styles.textAreaWrapper}>
                    <textarea
                        ref={ref}
                        rows={12}
                        className={clsx(styles.editorTextArea)}
                        onChange={(e) => doc.setData({ imageData: e.target.value }, Source.LOCAL)}
                        value={doc.data.imageData}
                        disabled={props.readonly}
                        onKeyDown={(e) => {
                            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                                doc.saveNow();
                                e.preventDefault();
                                e.stopPropagation();
                            }
                        }}
                    />
                </div>
                <div
                    className={clsx(styles.footer, 'alert', {
                        ['alert--secondary']: !doc.hasErrorsOrWarnings,
                        ['alert--warning']: doc.hasWarnings && !doc.hasErrors,
                        ['alert--danger']: doc.hasErrors
                    })}
                >
                    <div className={clsx(styles.validationWrapper)}>
                        {doc.hasErrorsOrWarnings ? (
                            <details>
                                <summary>
                                    {doc.hasErrors && (
                                        <>
                                            <span>Fehler in den Bilddaten</span>
                                            <span className={styles.iconContainer}>
                                                <Icon path={mdiAlertCircle} size={0.8} color="red" />
                                            </span>
                                        </>
                                    )}
                                    {!doc.hasErrors && doc.hasWarnings && (
                                        <>
                                            <span>Warnungen anzeigen</span>
                                            <span className={styles.iconContainer}>
                                                <Icon
                                                    path={mdiAlertCircleOutline}
                                                    size={0.8}
                                                    color="orange"
                                                />
                                            </span>
                                        </>
                                    )}
                                </summary>
                                <ul>
                                    {doc.warnings.map((warnung, index) => (
                                        <li key={index}>⚠️ {warnung}</li>
                                    ))}
                                    {doc.errors.map((error, index) => (
                                        <li key={index}>❌ {error}</li>
                                    ))}
                                </ul>
                            </details>
                        ) : (
                            <>
                                <span>Keine Fehler gefunden</span>
                                <span className={styles.iconContainer}>
                                    <Icon path={mdiCheckAll} size={0.8} />
                                </span>
                            </>
                        )}
                    </div>
                    <div className={clsx(styles.actions)}>
                        {!props.hideWarning && <StateIcons doc={doc} />}
                        <Button
                            icon={
                                doc.formattingState === ApiState.SUCCESS
                                    ? mdiTextBoxCheckOutline
                                    : mdiFormatTextRotationAngleUp
                            }
                            onClick={() => {
                                doc.format();
                            }}
                            spin={doc.formattingState === ApiState.SYNCING}
                            color={
                                doc.formattingState === ApiState.SYNCING
                                    ? 'var(--ifm-color-primary)'
                                    : doc.formattingState === ApiState.SUCCESS
                                      ? 'var(--ifm-color-success)'
                                      : undefined
                            }
                            size={SIZE_S}
                            title="Inhalt Formatieren"
                        />
                    </div>
                </div>
            </div>
            <div className={clsx(styles.output)}>
                <ImageCanvas
                    width={doc.width}
                    height={doc.height}
                    pixels={doc.pixels}
                    extension={doc.fileExtension}
                    format={doc.config.format}
                    actionsClassName={styles.downloadButton}
                />
            </div>
        </div>
    );
});

export default NetpbmEditor;
