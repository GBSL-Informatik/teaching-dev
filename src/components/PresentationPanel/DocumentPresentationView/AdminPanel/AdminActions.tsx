import React from 'react';
import clsx from 'clsx';
import styles from '../styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import StudentGroup from '@tdev-models/StudentGroup';
import Button from '@tdev-components/shared/Button';
import { mdiClose, mdiProjectorScreenOffOutline, mdiSync } from '@mdi/js';
import CanEditBadge from '../CanEditBadge';
import useIsMobileView from '@tdev-hooks/useIsMobileView';

interface Props {
    group: StudentGroup;
}

const AdminActions = observer((props: Props) => {
    const viewStore = useStore('viewStore');
    const isMobile = useIsMobileView(450);
    const isSmallDevice = useIsMobileView(420);
    const { group } = props;

    return (
        <div className={clsx(styles.actions, isSmallDevice && styles.actionsSmall)}>
            <CanEditBadge group={group} hideText={isMobile} />
            {!group.isPresentedDocumentStale && (
                <Button
                    icon={mdiSync}
                    title="Aktualisiere Präsentation auf allen Geräten"
                    noOutline
                    onClick={() => group.presentedDocument?.streamUpdate()}
                />
            )}
            <Button
                icon={mdiClose}
                title="Präsentationsmodus schliessen, ohne die Präsentation zu beenden"
                noOutline
                onClick={() => viewStore.setPresentationPanelState('closed')}
            />
            <Button
                icon={mdiProjectorScreenOffOutline}
                title="Präsentation beenden"
                noOutline
                onClick={() => group.apiSetPresentedDocumentProps(null)}
            />
        </div>
    );
});

export default AdminActions;
