import useIsBrowser from '@docusaurus/useIsBrowser';
import Alert from '@tdev-components/shared/Alert';
import { useStore } from '@tdev-hooks/useStore';
import TabItem from '@theme/TabItem';
import Tabs from '@theme/Tabs';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import DocumentPresentationView from './DocumentPresentationView';
import styles from './styles.module.scss';

interface Props {}

const PresentationPanel = observer((props: Props) => {
    const groupStore = useStore('studentGroupStore');

    const isBrowser = useIsBrowser();
    if (!isBrowser) {
        return <Alert type="info">Aktuell nicht verfügbar</Alert>;
    }

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
