import React from 'react';
import Popup from 'reactjs-popup';
import styles from './styles.module.scss';
import Button from '../shared/Button';
import { mdiShieldLockOutline } from '@mdi/js';
import DocumentRoot from '@site/src/models/DocumentRoot';
import { observer } from 'mobx-react-lite';
import { Access } from '@site/src/api/document';
import { useStore } from '@site/src/hooks/useStore';
import clsx from 'clsx';

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
    const userStore = useStore('userStore');
    const documentRootStore = useStore('documentRootStore');
    const documentRoot = documentRootStore.find(documentRootId);

    if (!userStore.current?.isAdmin || !documentRoot) {
        return null;
    }

    return (
        <Popup
            trigger={
                <span>
                    <Button
                        onClick={(e) => {
                            e.preventDefault();
                        }}
                        icon={mdiShieldLockOutline}
                        color="secondary"
                    />
                </span>
            }
            on="click"
            closeOnDocumentClick
            closeOnEscape
        >
            <div className={clsx(styles.wrapper, 'card')}>
                <div className={clsx('card__header', styles.header)}>
                    <h3>Berechtigungen Festlegen</h3>
                </div>
                <div className={clsx('card__body')}>
                    <div className={styles.popupContentContainer}>
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
                    </div>
                </div>
            </div>
        </Popup>
    );
});

export default PermissionsPanel;
