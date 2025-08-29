import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import Popup from 'reactjs-popup';
import {
    mdiFileCode,
    mdiFileDocument,
    mdiFolderOpenOutline,
    mdiFolderPlus,
    mdiLanguagePython,
    mdiPlusCircleOutline
} from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import { useStore } from '@tdev-hooks/useStore';
import { DocumentType } from '@tdev-api/document';
import Directory from '@tdev-models/documents/FileSystem/Directory';
import { Delta } from 'quill/core';
import DocumentStore from '@tdev-stores/DocumentStore';
import Icon from '@mdi/react';
import TextInput from '@tdev-components/shared/TextInput';
import { ExcalidrawColor, mdiExcalidraw } from '@tdev/excalidoc/Component';
import { PopupActions } from 'reactjs-popup/dist/types';

interface Props {
    directory: Directory;
}

const withFile = async (store: DocumentStore, rootId: string, parentId: string, name: string) => {
    return store.create({
        documentRootId: rootId,
        parentId: parentId,
        type: DocumentType.File,
        data: {
            isOpen: true,
            name: name
        }
    });
};

const SUPPORTED_EXTENSIONS = ['.py', '.svg', '.html', '.pbm', '.pgm', '.ppm'];

const asCodeName = (name?: string) => {
    if (!name) {
        return 'programm.py';
    }
    const extension = name.split('.').pop();
    if (SUPPORTED_EXTENSIONS.includes(`.${extension}`)) {
        return name;
    }
    return `${name}.py`;
};

const NewItem = observer((props: Props) => {
    const ref = React.useRef<PopupActions>(null);
    const [name, setName] = React.useState('');
    const isPyScript = React.useMemo(() => {
        return !name.includes('.') || name.split('.').pop() === 'py';
    }, [name]);
    const documentStore = useStore('documentStore');
    const closeTooltip = () => (ref.current as any)?.close();
    const { directory } = props;
    if (!directory.root) {
        return null;
    }
    const rootId = directory.root.id;
    return (
        <Popup
            trigger={
                <span>
                    <Button text="Neu" icon={mdiPlusCircleOutline} color="primary" size={0.8} />
                </span>
            }
            modal
            overlayStyle={{ background: 'rgba(0,0,0,0.5)' }}
            ref={ref}
        >
            <div className={clsx('card', styles.card)}>
                <div className={clsx('card__header', styles.header)}>
                    <h4 className={clsx(styles.h4)}>
                        <Icon path={mdiFolderOpenOutline} size={1} /> {directory.name}
                    </h4>
                </div>
                <div className={clsx('card__body', styles.body)}>
                    <TextInput onChange={setName} placeholder="Name" />
                    <Button
                        text={isPyScript ? 'Neues Python Snippet' : 'Neues Snippet'}
                        color="rgb(19, 165, 0)"
                        size={0.8}
                        icon={isPyScript ? mdiLanguagePython : mdiFileCode}
                        iconSide="left"
                        onClick={async () => {
                            withFile(documentStore, rootId, directory.id, asCodeName(name))
                                .then((file) => {
                                    if (file) {
                                        return documentStore.create({
                                            documentRootId: rootId,
                                            parentId: file.id,
                                            type: DocumentType.Script,
                                            data: {
                                                code: '\n'
                                            }
                                        });
                                    }
                                })
                                .then(() => {
                                    closeTooltip();
                                });
                        }}
                    />
                    <Button
                        text="Neue Notiz"
                        color="var(--ifm-color-blue)"
                        size={0.8}
                        icon={mdiFileDocument}
                        iconSide="left"
                        onClick={async () => {
                            withFile(documentStore, rootId, directory.id, name || 'Noitz')
                                .then((file) => {
                                    if (file) {
                                        return documentStore.create({
                                            documentRootId: rootId,
                                            parentId: file.id,
                                            type: DocumentType.QuillV2,
                                            data: {
                                                delta: { ops: [{ insert: '\n' }] } as Delta
                                            }
                                        });
                                    }
                                })
                                .then(() => {
                                    closeTooltip();
                                });
                        }}
                    />
                    <Button
                        text="Neue Skizze"
                        color={ExcalidrawColor}
                        size={0.8}
                        icon={mdiExcalidraw}
                        iconSide="left"
                        onClick={async () => {
                            withFile(documentStore, rootId, directory.id, name || 'Skizze')
                                .then((file) => {
                                    if (file) {
                                        return documentStore.create({
                                            documentRootId: rootId,
                                            parentId: file.id,
                                            type: DocumentType.Excalidoc,
                                            data: {
                                                elements: [],
                                                files: {},
                                                image: ''
                                            }
                                        });
                                    }
                                })
                                .then(() => {
                                    closeTooltip();
                                });
                        }}
                    />
                    <Button
                        text="Neuer Ordner"
                        color="black"
                        size={0.8}
                        icon={mdiFolderPlus}
                        iconSide="left"
                        onClick={async () => {
                            await documentStore.create({
                                documentRootId: rootId,
                                parentId: directory.id,
                                type: DocumentType.Dir,
                                data: {
                                    name: name || 'Ordner',
                                    isOpen: true
                                }
                            });
                            closeTooltip();
                        }}
                    />
                </div>
            </div>
        </Popup>
    );
});

export default NewItem;
