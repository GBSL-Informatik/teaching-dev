import useIsBrowser from '@docusaurus/useIsBrowser';
import { mdiClose, mdiFolderHomeOutline } from '@mdi/js';
import FileSystem from '@tdev-components/documents/FileSystem';
import Button from '@tdev-components/shared/Button';
import Card from '@tdev-components/shared/Card';
import customFields from '@tdev-components/utils/customFields';
import { useStore } from '@tdev-hooks/useStore';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import Popup from 'reactjs-popup';
import { PopupActions } from 'reactjs-popup/dist/types';
import styles from './styles.module.scss';
const { PERSONAL_SPACE_DOC_ROOT_ID } = customFields;

const PersonalSpaceOverlay = observer(() => {
    const isBrowser = useIsBrowser();
    const userStore = useStore('userStore');
    const sessionStore = useStore('sessionStore');
    const popupRef = React.useRef<PopupActions>(null);
    if (!isBrowser) {
        return null;
    }

    if (sessionStore.apiMode === 'api' && !userStore.current) {
        return null;
    }

    return (
        <Popup
            trigger={
                <div className={styles.buttonWrapper}>
                    <Button
                        className={clsx(styles.button)}
                        onClick={(e) => {
                            e.preventDefault();
                        }}
                        icon={mdiFolderHomeOutline}
                        color="primary"
                        iconSide="left"
                        title="Persönlicher Bereich"
                        text="Persönlicher Bereich"
                        textClassName={clsx(styles.text)}
                    />
                </div>
            }
            on="click"
            modal
            lockScroll
            closeOnDocumentClick={false}
            overlayStyle={{
                background: 'rgba(0,0,0,0.5)',
                width: '100vw',
                display: 'block'
            }}
            contentStyle={{
                height: '100vh',
                margin: 0
            }}
            ref={popupRef}
            closeOnEscape
            nested
        >
            <div className={clsx(styles.personalSpaceOverlay)}>
                <Card
                    classNames={{ card: clsx(styles.content) }}
                    header={
                        <div className={clsx(styles.header)}>
                            <h3>Persönlicher Bereich</h3>
                            <Button
                                icon={mdiClose}
                                text="Schliessen"
                                onClick={() => {
                                    popupRef.current?.close();
                                }}
                            />
                        </div>
                    }
                >
                    <FileSystem id={PERSONAL_SPACE_DOC_ROOT_ID} name="Persönlicher Bereich" />
                </Card>
            </div>
        </Popup>
    );
});

export default PersonalSpaceOverlay;
