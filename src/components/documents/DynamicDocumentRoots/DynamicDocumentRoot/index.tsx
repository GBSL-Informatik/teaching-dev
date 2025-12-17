import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import Loader from '@tdev-components/Loader';
import { MetaInit } from '@tdev-models/documents/DynamicDocumentRoots';
import PermissionsPanel from '@tdev-components/PermissionsPanel';
import { useStore } from '@tdev-hooks/useStore';
import Button from '@tdev-components/shared/Button';
import {
    mdiCircleEditOutline,
    mdiCloseCircle,
    mdiContentSaveOutline,
    mdiLocationEnter,
    mdiTrashCan
} from '@mdi/js';
import { useDocumentRoot } from '@tdev-hooks/useDocumentRoot';
import { default as DynamicDocumentRootMeta } from '@tdev-models/documents/DynamicDocumentRoot';
import { NoneAccess } from '@tdev-models/helpers/accessPolicy';
import RoomTypeSelector from '../RoomTypeSelector';

interface Props extends MetaInit {
    id: string;
    dynamicRootsDocumentId: string;
}

const DynamicDocumentRoot = observer((props: Props) => {
    const documentStore = useStore('documentStore');
    const componentStore = useStore('componentStore');
    const [meta] = React.useState(
        new DynamicDocumentRootMeta({}, props.id, props.dynamicRootsDocumentId, documentStore)
    );
    const [edit, setEdit] = React.useState(false);
    const [title, setTitle] = React.useState('');
    const docRoot = useDocumentRoot(props.id, meta, false, {}, true);
    if (!docRoot || docRoot.isDummy) {
        return (
            <div>
                {props.id}
                <Loader />
            </div>
        );
    }
    return (
        <div className={clsx(styles.dynamicDocRoot)}>
            {edit ? (
                <input
                    type="text"
                    value={title}
                    placeholder="Dynamische Document Root"
                    onChange={(e) => {
                        setTitle(e.target.value);
                    }}
                    autoFocus
                    className={clsx(styles.roomName)}
                    onKeyDown={(e) => {
                        const save = e.key === 'Enter' || ((e.ctrlKey || e.metaKey) && e.key === 's');
                        if (save) {
                            meta.setName(title);
                            setEdit(false);
                            e.preventDefault();
                            e.stopPropagation();
                        }
                        if (e.key === 'Escape') {
                            setEdit(false);
                        }
                    }}
                />
            ) : (
                <div className={clsx(styles.roomName)}>{meta.name}</div>
            )}
            {edit ? (
                <RoomTypeSelector dynamicRoot={meta} />
            ) : (
                <div className={clsx(styles.roomType, 'badge', 'badge--info')}>
                    {meta.roomType ? (componentStore.components.get(meta.roomType)?.name ?? '-') : '-'}
                </div>
            )}
            <Button
                text="Zum Raum"
                color="blue"
                href={`/rooms/${meta.parentRoot?.id}/${docRoot.id}`}
                disabled={!meta.parentRoot || NoneAccess.has(docRoot.permission)}
                icon={mdiLocationEnter}
                iconSide="left"
                textClassName={clsx(styles.roomButton)}
            />
            <div className={clsx(styles.actions)}>
                {meta.parentRoot?.hasRWAccess && (
                    <>
                        <Button
                            color={edit ? 'black' : 'orange'}
                            icon={edit ? mdiCloseCircle : mdiCircleEditOutline}
                            onClick={() => {
                                if (edit) {
                                    setEdit(false);
                                } else {
                                    setTitle(meta.name);
                                    setEdit(true);
                                }
                            }}
                        />
                        {edit && (
                            <Button
                                color={'green'}
                                icon={mdiContentSaveOutline}
                                disabled={meta.name === title || title === ''}
                                onClick={() => {
                                    meta.setName(title);
                                    setEdit(false);
                                }}
                            />
                        )}
                        <Button
                            color="red"
                            icon={mdiTrashCan}
                            onClick={() => {
                                meta.destroy();
                            }}
                        />
                    </>
                )}
                <PermissionsPanel documentRootId={docRoot.id} />
            </div>
        </div>
    );
});

export default DynamicDocumentRoot;
