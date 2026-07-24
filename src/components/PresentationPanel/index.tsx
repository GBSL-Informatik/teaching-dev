import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import DocumentPresentationView from './DocumentPresentationView';
import Alert from '@tdev-components/shared/Alert';

interface Props {}

const PresentationPanel = observer((props: Props) => {
    const groupStore = useStore('studentGroupStore');

    if (groupStore.presentingStudentGroups.length === 0) {
        return <Alert type="info">Keine Präsentation aktiv</Alert>;
    }

    if (groupStore.presentingStudentGroups.length === 1) {
        return (
            <div className={clsx(styles.presentationMode)}>
                <DocumentPresentationView group={groupStore.presentingStudentGroups[0]} />
            </div>
        );
    }

    return (
        <div className={clsx(styles.presentationMode)}>
            <Tabs className={clsx(styles.tabs)}>
                {groupStore.presentingStudentGroups.map((g, idx) => {
                    return (
                        <TabItem value={g.id} label={g.name} key={idx}>
                            <DocumentPresentationView group={g} />
                        </TabItem>
                    );
                })}
            </Tabs>
        </div>
    );
});

export default PresentationPanel;
