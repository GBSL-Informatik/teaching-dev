import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import shared from '../shared.module.scss';
import { observer } from 'mobx-react-lite';
import { default as FileModel } from '@tdev-models/documents/FileSystem/File';
import Icon from '@mdi/react';
import {
    mdiFile,
    mdiFileCode,
    mdiFileCodeOutline,
    mdiFileDocument,
    mdiFileDocumentOutline,
    mdiFileOutline
} from '@mdi/js';
import SyncStatus from '../../../SyncStatus';
import { DocumentType } from '@tdev-api/document';
import { QuillV2Component } from '../../QuillV2';
import Actions from '../Actions';
import Name from '../Name';
import FsDetails from '../FsDetails';
import {
    ExcalidocComponent,
    ExcalidrawColor,
    mdiExcalidraw,
    mdiExcalidrawOutline
} from '@tdev/excalidoc/Component';
import CodeEditorSelector from './CodeEditorSelector';

interface Props {
    file: FileModel;
}

const getColor = (type?: DocumentType) => {
    switch (type) {
        case 'quill_v2':
            return 'var(--ifm-color-blue)';
        case 'script':
            return 'rgb(19, 165, 0)';
        case 'excalidoc':
            return ExcalidrawColor;
        default:
            return undefined;
    }
};

export const getIcon = (type?: DocumentType) => {
    switch (type) {
        case 'quill_v2':
            return mdiFileDocumentOutline;
        case 'script':
            return mdiFileCodeOutline;
        case 'excalidoc':
            return mdiExcalidrawOutline;
        default:
            return mdiFileOutline;
    }
};

const getOpenIcon = (type?: DocumentType) => {
    switch (type) {
        case 'quill_v2':
            return mdiFileDocument;
        case 'script':
            return mdiFileCode;
        case 'excalidoc':
            return mdiExcalidraw;
        default:
            return mdiFile;
    }
};

const File = observer((props: Props) => {
    const { file } = props;
    return (
        <FsDetails
            model={file}
            className={clsx(shared.fsItem, styles.file)}
            summary={
                <summary className={clsx(shared.summary, styles.summary)}>
                    <Icon
                        path={file.isOpen ? getOpenIcon(file.document?.type) : getIcon(file.document?.type)}
                        size={0.8}
                        className={clsx(shared.icon)}
                        color={getColor(file.document?.type)}
                    />
                    <Name model={file} className={shared.name} />
                    <div className={clsx(shared.syncState)}>
                        <SyncStatus model={file} />
                    </div>
                    <div className={clsx(shared.actions)}>
                        <Actions item={file} />
                    </div>
                </summary>
            }
        >
            <div className={clsx(shared.content, styles.content)}>
                {file.document && file.isOpen && (
                    <>
                        {file.document.type === 'script' && <CodeEditorSelector code={file.document} />}
                        {file.document.type === 'quill_v2' && (
                            <QuillV2Component quillDoc={file.document} className={styles.quill} />
                        )}
                        {file.document.type === 'excalidoc' && (
                            <ExcalidocComponent
                                documentId={file.document.id}
                                height="80vh"
                                allowImageInsertion
                            />
                        )}
                    </>
                )}
            </div>
        </FsDetails>
    );
});

export default File;
