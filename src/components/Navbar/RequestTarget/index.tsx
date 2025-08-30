import React from 'react';
import clsx from 'clsx';

import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { mdiLaptop } from '@mdi/js';
import { useStore } from '@tdev-hooks/useStore';
import Button from '@tdev-components/shared/Button';
import useIsBrowser from '@docusaurus/useIsBrowser';
import Popup from 'reactjs-popup';
import _ from 'es-toolkit/compat';
import NavSetTargetRequest from '@tdev-components/Admin/ActionRequest/NavSetTargetRequest';

const RequestTarget = observer(() => {
    const isBrowser = useIsBrowser();
    const userStore = useStore('userStore');
    const sessionStore = useStore('sessionStore');
    const studentGroupStore = useStore('studentGroupStore');

    if (!isBrowser || !userStore.current?.hasElevatedAccess || sessionStore.apiMode !== 'api') {
        return null;
    }

    const klass = location.pathname.split('/')[1];

    return (
        <Popup
            trigger={
                <div className={styles.buttonWrapper}>
                    <Button
                        icon={mdiLaptop}
                        size={0.8}
                        className={clsx(styles.navTarget)}
                        iconSide="left"
                        color="primary"
                        title={`Aktuelle Seite anzeigen für`}
                        onClick={() => userStore.switchUser(undefined)}
                        text="Navigiere nach"
                        textClassName={clsx(styles.text)}
                    />
                </div>
            }
            on={['click', 'hover']}
            closeOnDocumentClick
            closeOnEscape
        >
            <div className={clsx(styles.wrapper, 'card')}>
                <div className={clsx('card__header', styles.header)}>
                    <h4>Diese Seite anzeigen für:</h4>
                </div>
                <div className={clsx('card__body', styles.body)}>
                    <div className={clsx(styles.groups)}>
                        {_.orderBy(
                            studentGroupStore.managedStudentGroups,
                            [(group) => group.name === klass, 'name'],
                            ['desc', 'asc']
                        ).map((group) => {
                            return (
                                <NavSetTargetRequest
                                    key={group.id}
                                    studentGroup={group}
                                    isActiveClass={group.name === klass}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>
        </Popup>
    );
});

export default RequestTarget;
