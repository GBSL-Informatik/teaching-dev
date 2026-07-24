import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import Popup from 'reactjs-popup';
import PresentationPanel from '..';

interface Props {}

const PresentationModal = observer((props: Props) => {
    const documentStore = useStore('documentStore');

    return (
        <Popup
            modal
            overlayStyle={{ background: 'rgba(226, 222, 222, 0.84)' }}
            open={documentStore.presentedDocuments.length > 0}
            repositionOnResize
            closeOnDocumentClick={false}
            closeOnEscape={false}
        >
            <PresentationPanel />
        </Popup>
    );
});

export default PresentationModal;
