import React, { useState } from 'react';
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';
import styles from './styles.module.scss';
import { rootStore } from '@site/src/stores/rootStore';
import Button from '../shared/Button';
import { mdiShieldLockOutline } from '@mdi/js';
import DocumentRoot from '@site/src/models/DocumentRoot';
import Loader from '@site/src/components/Loader';
import { observer } from 'mobx-react-lite';
import { Access } from '@site/src/api/document';

interface Props {
    documentRootId: string;
}

interface AccessRadioButtonProps {
    targetAccess: Access;
    accessProp: 'rootAccess' | 'sharedAccess';
    documentRoot: DocumentRoot<any>;
}

const AccessRadioButton = observer(({ targetAccess, accessProp, documentRoot }: AccessRadioButtonProps) => {
    const group = accessProp;
    const id = `${group}-${targetAccess}`;

    return (
        <div>
            <input
                type="radio"
                id={id}
                name={group}
                value={targetAccess}
                checked={targetAccess === documentRoot[accessProp]}
                onChange={(e) => {
                    documentRoot[accessProp] = e.target.value as Access;
                    documentRoot.save();
                }}
            />
            <label htmlFor={id}>{targetAccess}</label>
        </div>
    );
});

const PermissionsPanel = observer(({ documentRootId }: Props) => {
    const [documentRoot, setDocumentRoot] = useState<DocumentRoot<any> | null>();

    const onOpen = async () => {
        setDocumentRoot(rootStore.documentRootStore.find(documentRootId));
    };

    return (
        <>
            {rootStore.userStore.current?.isAdmin && (
                <Popup
                    trigger={<Button icon={mdiShieldLockOutline}></Button>}
                    onOpen={onOpen}
                    modal
                    closeOnEscape
                    closeOnDocumentClick
                >
                    <div className={styles.popupContentContainer}>
                        <h2>Permissions</h2>
                        {!!documentRoot && (
                            <div>
                                <div className={styles.radioGroup}>
                                    <b className={styles.radioGroupTitle}>Root access:</b>
                                    <AccessRadioButton
                                        targetAccess={Access.RW}
                                        accessProp="rootAccess"
                                        documentRoot={documentRoot}
                                    />
                                    <AccessRadioButton
                                        targetAccess={Access.RO}
                                        accessProp="rootAccess"
                                        documentRoot={documentRoot}
                                    />
                                    <AccessRadioButton
                                        targetAccess={Access.None}
                                        accessProp="rootAccess"
                                        documentRoot={documentRoot}
                                    />
                                </div>

                                <div className={styles.radioGroup}>
                                    <b className={styles.radioGroupTitle}>Shared access:</b>
                                    <AccessRadioButton
                                        targetAccess={Access.RW}
                                        accessProp="sharedAccess"
                                        documentRoot={documentRoot}
                                    />
                                    <AccessRadioButton
                                        targetAccess={Access.RO}
                                        accessProp="sharedAccess"
                                        documentRoot={documentRoot}
                                    />
                                    <AccessRadioButton
                                        targetAccess={Access.None}
                                        accessProp="sharedAccess"
                                        documentRoot={documentRoot}
                                    />
                                </div>
                            </div>
                        )}

                        {!documentRoot && <Loader />}
                    </div>
                </Popup>
            )}
        </>
    );
});

export default PermissionsPanel;
