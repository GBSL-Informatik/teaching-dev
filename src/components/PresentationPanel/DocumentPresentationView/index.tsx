import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import StudentGroup from '@tdev-models/StudentGroup';
import { CodeType } from '@tdev-api/document';
import CodeEditorComponent from '@tdev-components/documents/CodeEditor';
import iCode from '@tdev-models/documents/iCode';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import AdminPanel from './AdminPanel';
import CodeEditor from './CodeEditor';
import AdminActions from './AdminPanel/AdminActions';
import CanEditBadge from './CanEditBadge';

interface Props {
    group: StudentGroup;
}

const DocumentPresentationView = observer((props: Props) => {
    const userStore = useStore('userStore');
    const { group } = props;
    if (group.adminIds.has(userStore.current?.id ?? ' ')) {
        return (
            <div className={clsx(styles.presentationView)}>
                <Tabs className={clsx(styles.tabs)} lazy>
                    <TabItem value="presentation" label="Präsentation">
                        <CodeEditor group={group} />
                    </TabItem>
                    <TabItem value="permissions" label="Berechtigungen">
                        <AdminPanel group={group} />
                    </TabItem>
                </Tabs>
                <AdminActions group={group} />
            </div>
        );
    }

    return (
        <div className={clsx(styles.documentPresentationView)}>
            <CanEditBadge group={group} />
            <CodeEditorComponent code={group.presentedDocument as iCode<CodeType>} isPresentation />
        </div>
    );
});

export default DocumentPresentationView;
