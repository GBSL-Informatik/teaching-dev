import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import { CodeType } from '@tdev-api/document';
import type iCode from '@tdev-models/documents/iCode';
import Button from '@tdev-components/shared/Button';
import { mdiClose } from '@mdi/js';
import CodeEditorComponent from '@tdev-components/documents/CodeEditor';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import DocumentPresentationView from './DocumentPresentationView';

interface Props {}

const PresentationPanel = observer((props: Props) => {
    const groupStore = useStore('studentGroupStore');

    return (
        <div className={clsx(styles.presentationMode)}>
            <Tabs>
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
