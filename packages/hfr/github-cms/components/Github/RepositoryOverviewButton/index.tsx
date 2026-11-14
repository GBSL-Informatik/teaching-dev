import { mdiDotsVertical } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import React from 'react';
import Popup from 'reactjs-popup';
import type { PopupActions } from 'reactjs-popup/dist/types';
import RepositoryOverview from '../RepositoryOverview';

/**
 * Opens the github account, the local changes, pull requests and branches in a modal.
 */
const RepositoryOverviewButton = () => {
    const overviewRef = React.useRef<PopupActions>(null);

    return (
        <Popup
            ref={overviewRef}
            trigger={
                <div>
                    <Button
                        icon={mdiDotsVertical}
                        size={SIZE_S}
                        title="Github Account, Pull Requests und Branches"
                    />
                </div>
            }
            modal
            on="click"
            overlayStyle={{ background: 'rgba(0,0,0,0.5)' }}
        >
            <RepositoryOverview onClose={() => overviewRef.current?.close()} />
        </Popup>
    );
};

export default RepositoryOverviewButton;
