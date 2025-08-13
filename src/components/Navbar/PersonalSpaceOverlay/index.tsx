import styles from './styles.module.scss';
import Popup from 'reactjs-popup';
import clsx from 'clsx';
import { mdiFolderHomeOutline } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import Directory from '@tdev-components/documents/FileSystem/Directory';
import React from 'react';
import { PopupActions } from 'reactjs-popup/dist/types';
import siteConfig from '@generated/docusaurus.config';
const { PERSONAL_SPACE_DOC_ROOT_ID } = siteConfig.customFields as { PERSONAL_SPACE_DOC_ROOT_ID: string };

const PersonalSpaceOverlay = () => {
    const popupRef = React.useRef<PopupActions>(null);

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
                        color="blue"
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
        >
            <div className={clsx(styles.personalSpaceOverlay)} onClick={() => popupRef.current?.close()}>
                <div className={clsx(styles.content)}>
                    <Directory id={PERSONAL_SPACE_DOC_ROOT_ID} name="Persönlicher Bereich" />
                </div>
            </div>
        </Popup>
    );
};

export default PersonalSpaceOverlay;
