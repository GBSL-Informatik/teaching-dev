import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import Button from '../Button';
import { mdiClose, mdiPresentationPlay, mdiTelevisionStop } from '@mdi/js';
import { Color } from '../Colors';
import { useStore } from '@tdev-hooks/useStore';
import Popup from 'reactjs-popup';
import Card from '../Card';
import iDocument from '@tdev-models/iDocument';
import { action } from 'mobx';
import GroupSelector from './GroupSelector';

interface Props {
    document: iDocument<any>;
    size?: number;
    color?: Color | string;
    className?: string;
}

const RequestPresentationMode = observer((props: Props) => {
    const { document, className } = props;
    const pageStore = useStore('pageStore');
    const userStore = useStore('userStore');
    const groupStore = useStore('studentGroupStore');
    const [focus, setFocus] = React.useState(false);
    if (document.isDummy) {
        return null;
    }
    if (groupStore.managedStudentGroups.length === 0 || !userStore.current) {
        return null;
    }
    if (groupStore.presentedDocumentIds.has(document.id)) {
        return (
            <Button
                className={className}
                color={props.color || 'blue'}
                size={props.size}
                title={'Präsentation beenden'}
                icon={mdiTelevisionStop}
                onClick={() => {
                    groupStore.presentingStudentGroups.forEach((g) => {
                        if (g.presentedDocument?.id === document.id) {
                            g.apiSetPresentedDocumentProps(null);
                        }
                    });
                }}
            />
        );
    }

    return (
        <Popup
            trigger={
                <span>
                    <Button
                        className={clsx(className, focus && 'focus')}
                        color={props.color || 'blue'}
                        size={props.size}
                        title={'Präsentatieren'}
                        icon={mdiPresentationPlay}
                    />
                </span>
            }
            onOpen={() => setFocus(true)}
            onClose={() => setFocus(false)}
            on="click"
        >
            <Card>
                {groupStore.presentableStudentGroups
                    .filter((g) => pageStore.current?.relevantStudentGroupIds.has(g.id) ?? false)
                    .map((g) => (
                        <GroupSelector group={g} document={document} color="blue" key={g.id} />
                    ))}
                {groupStore.presentableStudentGroups
                    .filter((g) => !(pageStore.current?.relevantStudentGroupIds.has(g.id) ?? false))
                    .map((g) => (
                        <GroupSelector group={g} color="warning" document={document} key={g.id} />
                    ))}
                {groupStore.studentGroups
                    .filter((g) => !g.canPresent)
                    .map((g) => (
                        <GroupSelector group={g} document={document} noOutline key={g.id} />
                    ))}
            </Card>
        </Popup>
    );
});

export default RequestPresentationMode;
