import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import PermissionsPanel from '@tdev-components/PermissionsPanel';
import Button from '@tdev-components/shared/Button';
import {
    mdiCircleEditOutline,
    mdiCloseCircle,
    mdiContentSaveOutline,
    mdiLocationEnter,
    mdiTrashCan
} from '@mdi/js';
import { ContainerType, ContainerTypeModelMapping } from '@tdev-api/document';
import TextInput from '@tdev-components/shared/TextInput';
import { Delete } from '@tdev-components/shared/Button/Delete';
import EditDataProps from '../EditDataProps';

interface Props {
    docContainer: ContainerTypeModelMapping[ContainerType];
}

const DocumentContainer = observer((props: Props) => {
    const { docContainer } = props;
    const [edit, setEdit] = React.useState(false);

    return (
        <div className={clsx(styles.documentContainer)}>
            {edit ? (
                <TextInput
                    value={docContainer.name}
                    onChange={(val) => docContainer.setName(val)}
                    placeholder="Dynamische Document Root"
                    onEscape={() => {
                        docContainer.setName(docContainer._pristine.name);
                        setEdit(false);
                    }}
                    onSave={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (docContainer.name === '') {
                            docContainer.setName(docContainer._pristine.name);
                        }
                        docContainer.saveNow();
                        setEdit(false);
                    }}
                    onEnter={() => {
                        if (docContainer.name === '') {
                            docContainer.setName(docContainer._pristine.name);
                        }
                        docContainer.saveNow();
                        setEdit(false);
                    }}
                />
            ) : (
                <div className={clsx(styles.documentName)}>{docContainer.name}</div>
            )}

            {!edit && (
                <>
                    <div className={clsx(styles.roomType, 'badge', 'badge--info')}>
                        {docContainer.type ?? '-'}
                    </div>
                    <Button
                        text="Beitreten"
                        color="blue"
                        href={`/rooms/${docContainer.dynamicDocumentRoot?.root?.id}/${docContainer.root?.id}`}
                        disabled={!docContainer.dynamicDocumentRoot?.root?.id || !docContainer.canRead}
                        icon={mdiLocationEnter}
                        iconSide="left"
                        textClassName={clsx(styles.docButton)}
                    />
                </>
            )}
            {!edit && <EditDataProps docContainer={docContainer} />}
            <div className={clsx(styles.actions)}>
                {docContainer.hasAdminAccess && (
                    <>
                        <Button
                            color={edit ? 'black' : 'orange'}
                            icon={edit ? mdiCloseCircle : mdiCircleEditOutline}
                            onClick={() => {
                                if (edit) {
                                    docContainer.setName(docContainer._pristine.name);
                                    setEdit(false);
                                } else {
                                    setEdit(true);
                                }
                            }}
                        />
                        {edit && (
                            <Button
                                color={'green'}
                                icon={mdiContentSaveOutline}
                                disabled={
                                    docContainer.name === docContainer._pristine.name ||
                                    docContainer.name === ''
                                }
                                onClick={() => {
                                    docContainer.saveNow();
                                    setEdit(false);
                                }}
                            />
                        )}

                        {!edit && (
                            <Delete
                                color="red"
                                icon={mdiTrashCan}
                                text={''}
                                onDelete={() => {
                                    docContainer.dynamicDocumentRoot?.removeDynamicDocumentRoot(
                                        docContainer.documentRootId
                                    );
                                }}
                            />
                        )}
                    </>
                )}
                <PermissionsPanel documentRootId={docContainer.documentRootId} />
            </div>
        </div>
    );
});

export default DocumentContainer;
