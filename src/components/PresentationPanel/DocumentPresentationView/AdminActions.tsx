import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import StudentGroup from '@tdev-models/StudentGroup';
import Button from '@tdev-components/shared/Button';
import { mdiClose, mdiProjectorScreenOffOutline } from '@mdi/js';
import CanEditBadge from './CanEditBadge';

interface Props {
    group: StudentGroup;
}

const AdminActions = observer((props: Props) => {
    const viewStore = useStore('viewStore');
    const { group } = props;

    return (
        <div className={clsx(styles.actions)}>
            <CanEditBadge group={group} />
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
