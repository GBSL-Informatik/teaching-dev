import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import Button from '../Button';
import { mdiPresentationPlay, mdiTelevisionStop } from '@mdi/js';
import { Color } from '../Colors';
import { useStore } from '@tdev-hooks/useStore';
import Popup from 'reactjs-popup';
import Card from '../Card';
import iDocument from '@tdev-models/iDocument';
import { action } from 'mobx';

interface Props {
    document: iDocument<any>;
    size?: number;
    color?: Color | string;
    className?: string;
}

const RequestPresentationMode = observer((props: Props) => {
    const { document, className } = props;
    const userStore = useStore('userStore');
    const groupStore = useStore('studentGroupStore');
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
                            g.setPresentedDocumentProps(null);
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
                        className={className}
                        color={props.color || 'blue'}
                        size={props.size}
                        title={'Präsentatieren'}
                        icon={mdiPresentationPlay}
                    />
                </span>
            }
            on="click"
        >
            <Card>
                {groupStore.presentableStudentGroups.map((g) => (
                    <Button
                        key={g.id}
                        color="blue"
                        onClick={() => {
                            if (!document.root) {
                                return;
                            }
                            g.setPresentedDocumentProps({
                                document: document.props,
                                meta: document.root.meta,
                                access: document.root._access,
                                sharedAccess: document.root._sharedAccess
                            });
                        }}
                    >
                        {g.name}
                    </Button>
                ))}
                {groupStore.studentGroups
                    .filter((g) => !g.canPresent)
                    .map((g) => (
                        <Button
                            key={g.id}
                            color="secondary"
                            onClick={() => {
                                const root = document.root;
                                if (!root) {
                                    return;
                                }
                                g.setCanPresent(true).then(
                                    action((updated) => {
                                        updated.setPresentedDocumentProps({
                                            document: document.props,
                                            meta: root.meta,
                                            access: root._access,
                                            sharedAccess: root._sharedAccess
                                        });
                                    })
                                );
                            }}
                            title="Aktuell nicht berechtigt, Präsentationen zu starten - berechtigung wird gesetzt, sobald die Präsentation gestartet wird."
                        >
                            {g.name}
                        </Button>
                    ))}
            </Card>
        </Popup>
    );
});

export default RequestPresentationMode;
